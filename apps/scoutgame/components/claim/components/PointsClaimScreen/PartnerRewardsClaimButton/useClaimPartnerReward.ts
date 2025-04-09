import { log } from '@charmverse/core/log';
import { claimThirdwebERC20AirdropToken } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { checkPartnerRewardEligibilityAction } from '@packages/scoutgame/partnerReward/checkPartnerRewardEligibilityAction';
import { updatePartnerRewardPayoutAction } from '@packages/scoutgame/partnerReward/updatePartnerRewardPayoutAction';
import { useWalletSanctionCheck } from '@packages/scoutgame-ui/hooks/api/wallets';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Address, Hash, WalletClient } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';

export async function claimThirdwebERC20Airdrop({
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
    const hash = await claimThirdwebERC20AirdropToken({
      airdropContractAddress: contractAddress,
      claimer: recipientAddress,
      quantity: BigInt(amount),
      proofs: proof,
      chainId,
      walletClient
    });

    return { hash };
  } catch (error) {
    log.error('Error claiming partner reward', { error, contractAddress, chainId, recipientAddress });
    throw new Error('Failed to claim partner reward');
  }
}

export function useClaimPartnerReward({
  payoutContractId,
  contractAddress,
  rewardChainId,
  onSuccess,
  recipientAddress
}: {
  payoutContractId: string;
  contractAddress: Address;
  rewardChainId: number;
  onSuccess?: VoidFunction;
  recipientAddress: Address;
}) {
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { executeAsync: checkPartnerRewardEligibility } = useAction(checkPartnerRewardEligibilityAction);
  const [isClaiming, setIsClaiming] = useState(false);
  const { executeAsync: updatePartnerRewardPayout } = useAction(updatePartnerRewardPayoutAction);
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { mutate: checkWalletSanctionStatus } = useWalletSanctionCheck();

  const claimPartnerReward = async () => {
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      } else {
        toast.error('Unable to open wallet connection modal');
      }
      return;
    }

    if (!walletClient) {
      toast.error('No wallet client found');
      return;
    }

    if (chainId !== rewardChainId) {
      try {
        await switchChainAsync({ chainId: rewardChainId });
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });

        const currentChainId = await walletClient.getChainId();
        if (currentChainId !== rewardChainId) {
          toast.error('Failed to switch to the correct network');
          return;
        }

        toast.info('Switched to the correct network. Please try to claim again.');
        return;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to switch chain');
        return;
      }
    }

    const isSanctioned = await checkWalletSanctionStatus(recipientAddress);
    if (isSanctioned) {
      toast.error(`Wallet ${recipientAddress} is sanctioned. Try a different wallet`);
      return;
    }

    setIsClaiming(true);
    const eligibilityResult = await checkPartnerRewardEligibility({ payoutContractId });

    if (!eligibilityResult || eligibilityResult.serverError || !eligibilityResult.data) {
      toast.error(eligibilityResult?.serverError?.message || 'Failed to check airdrop eligibility');
      setIsClaiming(false);
      return;
    }

    const { index, proof, amount } = eligibilityResult.data;

    try {
      const { hash } = await claimThirdwebERC20Airdrop({
        chainId: rewardChainId,
        contractAddress,
        recipientAddress,
        walletClient,
        index,
        proof: proof as `0x${string}`[],
        amount
      });

      await updatePartnerRewardPayout({ payoutContractId, txHash: hash });

      toast.success('Partner reward claimed successfully');
      setIsClaiming(false);
      onSuccess?.();
    } catch (error) {
      log.error('Failed to claim partner reward', {
        error,
        amount,
        rewardChainId,
        contractAddress,
        recipientAddress
      });
      toast.error(error instanceof Error ? error.message : 'Failed to claim partner reward');
      setIsClaiming(false);
    }
  };

  return {
    isClaiming,
    claimPartnerReward,
    isConnected
  };
}
