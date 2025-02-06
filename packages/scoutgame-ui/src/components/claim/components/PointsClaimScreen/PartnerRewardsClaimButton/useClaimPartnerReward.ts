import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { checkAirdropEligibilityAction } from '@packages/scoutgame/airdrop/checkAirdropEligibilityAction';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Address, Hash, WalletClient } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';

import { updatePartnerRewardPayoutAction } from '../../../../../actions/updatePartnerRewardPayoutAction';
import { useUser } from '../../../../../providers/UserProvider';

export async function claimSablierAirdrop({
  chainId,
  contractAddress,
  recipientAddress,
  walletClient,
  index,
  proof,
  amount
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  index: number;
  proof: `0x${string}`[];
  amount: string;
  walletClient: WalletClient;
}): Promise<{ hash: Hash }> {
  const publicClient = getPublicClient(chainId);

  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: [
        {
          type: 'function',
          name: 'claim',
          inputs: [
            {
              name: 'index',
              type: 'uint256',
              internalType: 'uint256'
            },
            {
              name: 'recipient',
              type: 'address',
              internalType: 'address'
            },
            {
              name: 'amount',
              type: 'uint128',
              internalType: 'uint128'
            },
            {
              name: 'merkleProof',
              type: 'bytes32[]',
              internalType: 'bytes32[]'
            }
          ],
          outputs: [],
          stateMutability: 'payable'
        }
      ],
      functionName: 'claim',
      args: [BigInt(index), recipientAddress, BigInt(amount), proof],
      account: recipientAddress,
      value: 0n
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('SablierMerkleBase_StreamClaimed')) {
        throw new Error('This airdrop has already been claimed');
      }
      if (error.message.includes('SablierMerkleBase_CampaignExpired')) {
        throw new Error('This airdrop campaign has expired');
      }
      if (error.message.includes('SablierMerkleBase_InvalidProof')) {
        throw new Error('Invalid Merkle proof for this claim');
      }
      if (error.message.includes('SablierMerkleBase_InsufficientFeePayment')) {
        throw new Error('Not enough ETH sent to cover the claim fee');
      }
      if (error.message.includes('SablierMerkleBase_FeeTransferFail')) {
        throw new Error('Failed to transfer claim fee');
      }
      if (error.message.includes('User rejected')) {
        throw new Error('Transaction rejected by user');
      }
    }
    throw error;
  }
}

export function useClaimPartnerReward({
  payoutId,
  contractAddress,
  rewardChainId
}: {
  payoutId: string;
  contractAddress: Address;
  rewardChainId: number;
}) {
  const { user } = useUser();
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { executeAsync: checkAirdropEligibility } = useAction(checkAirdropEligibilityAction);
  const [isClaiming, setIsClaiming] = useState(false);
  const { executeAsync: updatePartnerRewardPayout } = useAction(updatePartnerRewardPayoutAction);
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const primaryAddress = user?.primaryWalletAddress;

  const claimPartnerReward = async () => {
    if (address !== primaryAddress) {
      toast.error('Please switch to your primary wallet address to claim this reward');
      return;
    }

    if (!primaryAddress) {
      toast.error('No primary address found');
      return;
    }

    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!walletClient) {
      toast.error('No wallet client found');
      return;
    }

    if (chainId !== rewardChainId) {
      try {
        await switchChainAsync({ chainId: rewardChainId });
      } catch (error) {
        toast.error('Failed to switch chain');
        return;
      }
    }

    setIsClaiming(true);
    const eligibilityResult = await checkAirdropEligibility({ payoutId });

    if (!eligibilityResult || !eligibilityResult.serverError || !eligibilityResult.data) {
      toast.error('Failed to check airdrop eligibility');
      setIsClaiming(false);
      return;
    }

    const { index, proof, amount } = eligibilityResult.data;

    try {
      const { hash } = await claimSablierAirdrop({
        chainId: rewardChainId,
        contractAddress,
        recipientAddress: primaryAddress as `0x${string}`,
        walletClient,
        index,
        proof,
        amount
      });

      await updatePartnerRewardPayout({ payoutId, txHash: hash });

      toast.success('Airdrop claimed successfully');
      setIsClaiming(false);
    } catch (error) {
      toast.error('Failed to claim airdrop');
      setIsClaiming(false);
    }
  };

  return {
    isClaiming,
    claimPartnerReward
  };
}
