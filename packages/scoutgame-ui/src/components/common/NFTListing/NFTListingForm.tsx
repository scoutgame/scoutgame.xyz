'use client';

import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { LoadingButton } from '@mui/lab';
import { Alert, Box, FormLabel, Stack, Typography } from '@mui/material';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import { createNftListingAction } from '@packages/scoutgame/nftListing/createNftListingAction';
import { devTokenDecimals, scoutProtocolChain } from '@packages/scoutgame/protocol/constants';
import { createSeaportListing } from '@packages/scoutgame/seaport/createSeaportListing';
import { isOnchainPlatform } from '@packages/utils/platform';
import { fancyTrim } from '@packages/utils/strings';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { formatUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { NumberInputField } from '../NFTPurchaseDialog/components/NumberField';

import { useGetDeveloperToken } from './hooks/useGetDeveloperToken';

export type NFTListingFormProps = {
  builder: {
    id: string;
    path: string;
    displayName: string;
    builderStatus: BuilderStatus | null;
    nftImageUrl?: string | null;
    price?: bigint;
  };
  onSuccess?: () => void;
};

export function NFTListingForm({ builder, onSuccess }: NFTListingFormProps) {
  const isOnchain = isOnchainPlatform();
  const [priceInUsdc, setPriceInUsdc] = useState(0);
  const { address: sellerWallet, chainId } = useAccount();
  const { executeAsync: createNftListing, isExecuting } = useAction(createNftListingAction);
  const { data: developerToken, isLoading } = useGetDeveloperToken({ builderId: builder.id, nftType: 'default' });
  const { switchChainAsync } = useSwitchChain();
  const [isListing, setIsListing] = useState(false);

  const currentPriceInUsdc = isOnchain
    ? // TODO: Dev tokens prices will be dynamic in the future post listing so remove the hard coded 0.02
      (Number(builder.price || 0) / 10 ** devTokenDecimals) * 0.02
    : formatUnits(builder.price || BigInt(0), builderTokenDecimals);

  const onListing = useCallback(async () => {
    try {
      setIsListing(true);
      if (!developerToken) {
        return;
      }

      if (!sellerWallet) {
        throw new Error('No wallet address found');
      }

      if (chainId !== scoutProtocolChain.id) {
        await switchChainAsync({
          chainId: scoutProtocolChain.id
        });
      }

      const order = await createSeaportListing({
        sellerWallet,
        price: BigInt(priceInUsdc * 10 ** 6),
        amount: 1,
        contractAddress: developerToken.contractAddress,
        tokenId: developerToken.tokenId.toString()
      });

      await createNftListing({
        builderNftId: developerToken.builderNftId,
        price: priceInUsdc,
        amount: 1,
        order,
        sellerWallet
      });

      toast.success('NFT listing created successfully');
      onSuccess?.();
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Error listing NFT';
      if (message.includes('denied')) {
        message = 'User rejected the transaction';
      }
      toast.error(message);
      log.error('Error listing NFT', { error });
    } finally {
      setIsListing(false);
    }
  }, [builder, priceInUsdc, sellerWallet, isExecuting, chainId, switchChainAsync]);

  const isOwner = developerToken && developerToken.scoutAddress.toLowerCase() === sellerWallet?.toLowerCase();
  const isDisabled = !sellerWallet || !developerToken || !isOwner;

  return (
    <Stack gap={2} width='400px' maxWidth='100%' mx='auto'>
      <Box
        bgcolor='black.dark'
        width='100%'
        pt={2}
        pb={1}
        display='flex'
        alignItems='center'
        flexDirection='column'
        gap={1}
      >
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.path}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '40%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
      </Box>
      <Box display='flex' alignItems='center' gap={0.5}>
        <Typography variant='h6'>Current price: {currentPriceInUsdc}</Typography>
        <Image src='/images/crypto/usdc.png' alt='usdc' width={20} height={20} />
      </Box>
      {!isLoading && !isOwner && (
        <Alert severity='warning'>
          You must be the owner of the NFT to list it. Please transfer the NFT to your wallet or switch to the correct
          wallet and try again. <br />
          Owner address: {fancyTrim(developerToken?.scoutAddress, 10)}
        </Alert>
      )}
      <Stack>
        <FormLabel>Listing price (USDC)</FormLabel>
        <NumberInputField
          fullWidth
          color='secondary'
          type='number'
          placeholder='1'
          InputProps={{
            inputProps: {
              step: 0.1
            }
          }}
          value={priceInUsdc}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value > 0) {
              setPriceInUsdc(value);
            }
          }}
          disabled={isDisabled}
          disableArrows
          sx={{ '& input': { textAlign: 'center' } }}
        />
      </Stack>
      <LoadingButton
        variant='contained'
        color='primary'
        disabled={priceInUsdc === 0 || isDisabled}
        onClick={onListing}
        loading={isListing || isLoading || isExecuting}
      >
        List
      </LoadingButton>
    </Stack>
  );
}
