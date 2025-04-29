import { log } from '@charmverse/core/log';
import { claimThirdwebERC20AirdropToken } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { checkPartnerRewardEligibilityAction } from '@packages/scoutgame/partnerRewards/checkPartnerRewardEligibilityAction';
import { updatePartnerRewardPayoutAction } from '@packages/scoutgame/partnerRewards/updatePartnerRewardPayoutAction';
import { useWalletSanctionCheck } from '@packages/scoutgame-ui/hooks/api/wallets';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAction } from 'next-safe-action/hooks';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import type { Address, Hash, WalletClient } from 'viem';
import { parseEther } from 'viem';
import { useAccount, useSwitchChain, useWalletClient, useBalance } from 'wagmi';

import sablierAirdropAbi from './SablierMerkleInstant.json';

function usePartnerReward({
  payoutContractId,
  recipientAddress,
  rewardChainId
}: {
  payoutContractId: string;
  recipientAddress: Address;
  rewardChainId: number;
}) {
  const [isClaiming, setIsClaiming] = useState(false);

  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { executeAsync: checkPartnerRewardEligibility } = useAction(checkPartnerRewardEligibilityAction);
  const { mutate: checkWalletSanctionStatus } = useWalletSanctionCheck();
  const { switchChainAsync } = useSwitchChain();
  const { executeAsync: updatePartnerRewardPayout } = useAction(updatePartnerRewardPayoutAction);

  const checkPartnerReward = async () => {
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
        try {
          await switchChainAsync({ chainId: rewardChainId });
        } catch (error) {
          // some wallets dont support switching chain
          log.warn('Error switching chain for partner reward', { chainId, rewardChainId, error });
        }
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

    const { proof, index, amount } = eligibilityResult.data;

    return {
      index,
      proof: proof as `0x${string}`[],
      amount
    };
  };

  const claimPartnerReward = async (
    claimFn: (args: {
      index: number;
      proof: `0x${string}`[];
      amount: string;
      walletClient: WalletClient;
    }) => Promise<{ hash: Address }>,
    onSuccess?: VoidFunction
  ) => {
    if (!walletClient) {
      return;
    }

    const partnerRewardEligibility = await checkPartnerReward();

    if (!partnerRewardEligibility) {
      return;
    }

    const { index, proof, amount } = partnerRewardEligibility;

    setIsClaiming(true);
    try {
      const { hash } = await claimFn({ index, proof, amount, walletClient });
      await updatePartnerRewardPayout({ payoutContractId, txHash: hash });
      toast.success('Partner reward claimed successfully');
      onSuccess?.();
    } catch (error) {
      log.error('Failed to claim partner reward', { error, payoutContractId, recipientAddress, rewardChainId });
      toast.error(error instanceof Error ? error.message : 'Failed to claim partner reward');
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isConnected,
    claimPartnerReward,
    isClaiming
  };
}

export async function claimSablierAirdrop({
  chainId,
  contractAddress,
  recipientAddress,
  walletClient,
  index,
  proof,
  amount,
  fee
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  index: number;
  proof: `0x${string}`[];
  amount: string;
  walletClient: WalletClient;
  fee: bigint;
}): Promise<{ hash: Hash }> {
  const publicClient = getPublicClient(chainId);

  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi: sablierAirdropAbi.abi,
      functionName: 'claim',
      args: [BigInt(index), recipientAddress, BigInt(amount), proof],
      account: recipientAddress,
      value: fee
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });

    return { hash };
  } catch (error) {
    log.error('Error claiming partner reward', { error, contractAddress, chainId, recipientAddress });
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
    throw new Error('Failed to claim partner reward');
  }
}

export function useClaimSablierAirdrop({
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
  const { isConnected, claimPartnerReward, isClaiming } = usePartnerReward({
    payoutContractId,
    recipientAddress,
    rewardChainId
  });

  const { data: balance } = useBalance({
    address: recipientAddress,
    chainId: rewardChainId,
    unit: 'ether',
    token: undefined
  });

  const { data: ethPrice, error: ethPriceError } = useSWR('eth-price', async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd as number;
  });

  // feeAmount is one USD in wei units
  const feeAmount = useMemo(() => {
    if (!ethPrice) {
      return null;
    }
    return parseEther((1 / ethPrice).toFixed(18));
  }, [ethPrice]);

  useEffect(() => {
    if (ethPriceError) {
      log.error('Failed to fetch ETH price', { error: ethPriceError });
      toast.error('Something went wrong, please try again later');
    }
  }, [ethPriceError]);

  const claim = () => {
    claimPartnerReward(
      ({ index, proof, amount, walletClient }) =>
        claimSablierAirdrop({
          chainId: rewardChainId,
          contractAddress,
          recipientAddress,
          walletClient,
          index,
          proof: proof as `0x${string}`[],
          amount,
          fee: feeAmount!
        }),
      onSuccess
    );
  };

  return {
    isClaiming,
    claim,
    isConnected,
    hasEnoughFee: balance?.value && feeAmount ? balance.value >= feeAmount : false,
    feeAmount
  };
}

export async function claimThirdwebAirdrop({
  chainId,
  contractAddress,
  recipientAddress,
  walletClient,
  proof,
  amount
}: {
  chainId: number;
  contractAddress: Address;
  recipientAddress: Address;
  proof: `0x${string}`[];
  amount: string;
  walletClient: WalletClient;
}): Promise<{ hash: Address }> {
  try {
    const hash = await claimThirdwebERC20AirdropToken({
      airdropContractAddress: contractAddress,
      receiver: recipientAddress,
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

export function useClaimThirdwebAirdrop({
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
  const { isConnected, claimPartnerReward, isClaiming } = usePartnerReward({
    payoutContractId,
    recipientAddress,
    rewardChainId
  });

  const claim = async () => {
    claimPartnerReward(
      ({ proof, amount, walletClient }) =>
        claimThirdwebAirdrop({
          chainId: rewardChainId,
          contractAddress,
          recipientAddress,
          proof: proof as `0x${string}`[],
          amount,
          walletClient
        }),
      onSuccess
    );
  };

  return {
    isClaiming,
    claim,
    isConnected
  };
}
