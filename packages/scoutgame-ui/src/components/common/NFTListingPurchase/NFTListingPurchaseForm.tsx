import { log } from '@charmverse/core/log';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { LoadingButton } from '@mui/lab';
import { Stack } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { transferSingleAbi } from '@packages/scoutgame/builderNfts/accounting/getTransferSingleEvents';
import { builderTokenDecimals } from '@packages/scoutgame/builderNfts/constants';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { purchaseNftListingAction } from '@packages/scoutgame/nftListing/purchaseNftListingAction';
import { devTokenDecimals, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { nftListingErc20Address } from '@packages/scoutgame/seaport/createSeaportListing';
import { purchaseSeaportListing } from '@packages/scoutgame/seaport/purchaseSeaportListing';
import { isOnchainPlatform } from '@packages/utils/platform';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';
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
  const isOnchain = isOnchainPlatform();
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

  const listingPrice = isOnchain
    ? Number(BigInt(listing.price) / BigInt(10 ** devTokenDecimals))
    : Number(listing.price) / 10 ** builderTokenDecimals;

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

      const receiptLogs = parseEventLogs({
        abi: [transferSingleAbi],
        logs: receipt.logs,
        eventName: ['TransferSingle']
      });

      const txLogIndex =
        receiptLogs.find(
          (receiptLog) =>
            receiptLog.args.operator.toLowerCase() === _address || receiptLog.args.to.toLowerCase() === _address
        )?.logIndex ?? 0;

      // Second step: Call the server action to update the database
      await purchaseNftListing({
        listingId: listing.id,
        buyerWallet: address as `0x${string}`,
        txHash: receipt.transactionHash,
        txLogIndex
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

  if (approvalRequired) {
    return (
      <Stack gap={2} width='400px' maxWidth='100%' mx='auto'>
        <ERC20ApproveButton
          spender={seaportContractAddress}
          chainId={scoutProtocolChainId}
          erc20Address={nftListingErc20Address}
          amount={BigInt(listing.price)}
          onSuccess={() => refreshAllowance()}
          decimals={isOnchain ? devTokenDecimals : builderTokenDecimals}
          currency={isOnchain ? 'DEV' : 'USDC'}
          actionType='purchase'
        />
      </Stack>
    );
  }

  return (
    <LoadingButton
      variant='buy'
      color='secondary'
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
      {listingPrice} &nbsp;{' '}
      {isOnchain ? 'DEV' : <Image src='/images/crypto/usdc.png' alt='usdc' width={18} height={18} />}
    </LoadingButton>
  );
}
