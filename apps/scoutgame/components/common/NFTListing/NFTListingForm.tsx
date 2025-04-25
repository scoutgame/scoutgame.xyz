'use client';

import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Button, Alert, Box, FormLabel, Stack } from '@mui/material';
import { recordNftListingAction } from '@packages/scoutgame/nftListing/recordNftListingAction';
import { scoutProtocolChain } from '@packages/scoutgame/protocol/constants';
import { recordSeaportListing } from '@packages/scoutgame/seaport/recordSeaportListing';
import { fancyTrim } from '@packages/utils/strings';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { useGetDeveloperToken } from '../../../hooks/api/builders';
import { NumberInputField } from '../NFTPurchaseDialog/components/NumberField';

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
  const [price, setPrice] = useState(0);
  const { address: sellerWallet, chainId } = useAccount();
  const { executeAsync: recordNftListing, isExecuting } = useAction(recordNftListingAction);
  const { data: developerToken, isLoading } = useGetDeveloperToken({ builderId: builder.id, nftType: 'default' });
  const { switchChainAsync } = useSwitchChain();
  const [isListing, setIsListing] = useState(false);

  const onListing = useCallback(async () => {
    setIsListing(true);
    if (!developerToken) {
      return;
    }

    try {
      if (!sellerWallet) {
        throw new Error('No wallet address found');
      }

      if (!developerToken.contractAddress) {
        throw new Error('No contract address found');
      }

      if (!developerToken.developerWallet) {
        throw new Error('No developer wallet found');
      }

      if (chainId !== scoutProtocolChain.id) {
        await switchChainAsync({
          chainId: scoutProtocolChain.id
        });
      }

      const order = await recordSeaportListing({
        sellerWallet,
        price: parseUnits(price.toString(), 18),
        amount: 1,
        contractAddress: developerToken.contractAddress,
        tokenId: developerToken.tokenId.toString(),
        developerWallet: developerToken.developerWallet
      });

      await recordNftListing({
        builderNftId: developerToken.builderNftId,
        price,
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
      log.error('Error listing NFT', { error, developerNftId: developerToken.builderNftId });
    } finally {
      setIsListing(false);
    }
  }, [builder, price, sellerWallet, isExecuting, chainId, switchChainAsync, developerToken]);

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
      {!isLoading && !isOwner && (
        <Alert severity='warning'>
          You must be the owner of the NFT to list it. Please transfer the NFT to your wallet or switch to the correct
          wallet and try again. <br />
          Owner address: {fancyTrim(developerToken?.scoutAddress, 10)}
        </Alert>
      )}
      <Stack>
        <FormLabel>Listing price (DEV)</FormLabel>
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
          value={price}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!Number.isNaN(value) && value > 0) {
              setPrice(value);
            }
          }}
          disabled={isDisabled}
          disableArrows
          sx={{ '& input': { textAlign: 'center' } }}
        />
      </Stack>
      <Button
        variant='contained'
        color='primary'
        disabled={price === 0 || isDisabled}
        onClick={onListing}
        loading={isListing || isLoading || isExecuting}
      >
        List
      </Button>
    </Stack>
  );
}
