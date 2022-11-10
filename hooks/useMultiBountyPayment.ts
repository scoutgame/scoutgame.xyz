import type { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import type { Bounty } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import useGnosisSigner from 'hooks/useWeb3Signer';
import type { BountyWithDetails } from 'lib/bounties';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

import { useBounties } from './useBounties';
import { useCurrentSpace } from './useCurrentSpace';

export interface TransactionWithMetadata extends MetaTransactionData, Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'>{
  applicationId: string;
  userId: string;
  title: string;
}

export function useMultiBountyPayment ({ bounties, postPaymentSuccess }:
  { postPaymentSuccess?: () => void, bounties: BountyWithDetails[], selectedApplicationIds?: string[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const [currentSpace] = useCurrentSpace();
  const { account, chainId } = useWeb3React();
  const signer = useGnosisSigner();
  const { data: safeData } = useSWR(
    (signer && account && chainId) ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  useEffect(() => {
    if (safeData) {
      setGnosisSafeData(safeData[0]);
    }
  }, [safeData]);

  const gnosisSafeAddress = gnosisSafeData?.address;
  const gnosisSafeChainId = gnosisSafeData?.chainId;

  // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
  const transactions: ((safeAddress: string) => TransactionWithMetadata)[] = useMemo(
    () => bounties
      .filter(bounty => {
        return safeData ? safeData.some(safe => bounty.chainId === safe.chainId) : false;
      })
      .map(bounty => {
        return bounty.applications
          .filter(application => application.status === 'complete')
          .map(application => {
            return (safeAddress?: string) => {
            // todo: make transactions callable with safe address
              let data = '0x';
              let value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
              // assume this is ERC20 if its not a native token
              if (safeAddress && bounty.rewardToken !== getChainById(bounty.chainId)?.nativeCurrency.symbol) {
                const ABI = [
                  'function safeTransferFrom(address token, address from, address to, uint256 value)'
                ];
                const iface = new ethers.utils.Interface(ABI);
                data = iface.encodeFunctionData(
                  'safeTransferFrom',
                  [bounty.rewardToken, safeAddress, application.walletAddress, value]
                );
                value = '0';
              }
              return {
                to: application.walletAddress as string,
                value,
                data,
                applicationId: application.id,
                userId: application.createdBy,
                chainId: bounty.chainId,
                rewardAmount: bounty.rewardAmount,
                rewardToken: bounty.rewardToken,
                title: bounty.page?.title || 'Untitled'
              };
            };
          });
      })
      .flat(),
    [bounties, safeData]
  );

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisSafeAddress && gnosisSafeChainId) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.bounties.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisSafeChainId.toString()
          });
          await charmClient.bounties.markSubmissionAsPaid(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.bounties.listBounties(currentSpace.id)
          .then(_bounties => {
            setBounties(_bounties);
            const newCurrentBounty = _bounties.find(_bounty => _bounty.id === currentBountyId);
            if (newCurrentBounty) {
              setCurrentBounty({ ...newCurrentBounty });
            }
          });
      }
      setIsLoading(false);
      postPaymentSuccess?.();
    }
  }

  const isDisabled = transactions.length === 0;

  return {
    isLoading,
    isDisabled,
    transactions,
    onPaymentSuccess,
    gnosisSafeChainId,
    gnosisSafeAddress,
    safeData,
    gnosisSafeData,
    setGnosisSafeData
  };
}
