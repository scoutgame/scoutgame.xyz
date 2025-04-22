import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { LoadingButton } from '@mui/lab';
import { Box, Stack } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { purchaseNftListingAction } from '@packages/scoutgame/nftListing/purchaseNftListingAction';
import { devTokenDecimals, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { purchaseSeaportListing } from '@packages/scoutgame/seaport/purchaseSeaportListing';
import { nftListingErc20Address } from '@packages/scoutgame/seaport/recordSeaportListing';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { ERC20ApproveButton } from '../NFTPurchaseDialog/components/ERC20Approve';
import { useGetERC20Allowance } from '../NFTPurchaseDialog/hooks/useGetERC20Allowance';

const seaportContractAddress = '0x0000000000000068F116a894984e2DB1123eB395';

export type NFTListingPurchaseFormProps = {
  listing: NonNullable<BuilderInfo['listings'][number]>;
  builder: {
    path: string;
    builderStatus: BuilderStatus | null;
    displayName: string;
    nftImageUrl?: string | null;
    price?: bigint;
  };
  onSuccess?: () => void;
};

export function NFTListingPurchaseForm({ listing, builder, onSuccess }: NFTListingPurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: scoutProtocolChainId,
    erc20Address: nftListingErc20Address,
    owner: address as Address,
    spender: seaportContractAddress
  });

  const approvalRequired = typeof allowance === 'bigint' && allowance < BigInt(listing.price);

  const { executeAsync: purchaseNftListing, isExecuting } = useAction(purchaseNftListingAction, {
    onSuccess: () => {
      toast.success('NFT purchased successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to purchase NFT');
    }
  });

  const listingPrice = Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals));

  async function handlePurchase() {
    if (!address) {
      toast.error('No wallet address found');
      return;
    }

    const _address = address.toLowerCase() as `0x${string}`;

    setIsLoading(true);

    if (chainId !== scoutProtocolChainId) {
      await switchChainAsync({
        chainId: scoutProtocolChainId
      });
    }

    try {
      const preparedTx = await purchaseSeaportListing({
        order: listing.order,
        buyerWallet: _address
      });

      const publicClient = getPublicClient(scoutProtocolChainId);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: preparedTx.hash as `0x${string}`
      });

      // Second step: Call the server action to update the database
      await purchaseNftListing({
        listingId: listing.id,
        buyerWallet: address as `0x${string}`,
        txHash: receipt.transactionHash
      });
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Error purchasing listed NFT';
      if (message.includes('denied')) {
        message = 'User rejected the transaction';
      }
      toast.error(message);
      log.error('Failed to purchase NFT:', { error, listingId: listing.id, walletAddress: address });
    } finally {
      setIsLoading(false);
    }
  }

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
      {approvalRequired ? (
        <ERC20ApproveButton
          spender={seaportContractAddress}
          chainId={scoutProtocolChainId}
          erc20Address={nftListingErc20Address}
          amount={BigInt(listing.price)}
          onSuccess={() => refreshAllowance()}
          decimals={devTokenDecimals}
          currency='DEV'
          actionType='purchase'
        />
      ) : (
        <LoadingButton
          color='primary'
          variant='contained'
          fullWidth
          onClick={() => {
            if (!address && !connectModalOpen) {
              openConnectModal?.();
            } else if (address) {
              handlePurchase();
            }
          }}
          disabled={!address}
          loading={isLoading || isExecuting}
        >
          {listingPrice} &nbsp; DEV
        </LoadingButton>
      )}
    </Stack>
  );
}
