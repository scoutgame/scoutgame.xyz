'use client';

import { log } from '@charmverse/core/log';
import { claimThirdwebERC20AirdropToken } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { AIRDROP_SAFE_WALLET } from '@packages/blockchain/constants';
import { scoutTokenErc20ContractAddress } from '@packages/scoutgame/protocol/constants';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { erc20Abi } from 'viem';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { base } from 'wagmi/chains';

import { useDevTokenBalance } from '../../hooks/useDevTokenBalance';
import { getAirdropTokenStatusAction } from '../../lib/getAirdropTokenStatusAction';
import { trackAirdropClaimPayoutAction } from '../../lib/trackAirdropClaimPayoutAction';

import { AlreadyClaimedStep } from './components/AlreadyClaimedStep';
import { DonationConfirmationStep } from './components/DonationConfirmationStep';
import type { DonationPercentage } from './components/DonationSelectionStep';
import { DonationSelectionStep } from './components/DonationSelectionStep';
import { NotQualifiedStep } from './components/NotQualifiedStep';
import { ShowClaimableTokensStep } from './components/ShowClaimableTokensStep';
import { StartClaimStep } from './components/StartClaimStep';
import { TokenClaimSuccessStep } from './components/TokenClaimSuccessStep';

export type ClaimTokenStep =
  | 'start_claim'
  | 'show_claimable_tokens'
  | 'donation_selection'
  | 'donation_confirmation'
  | 'token_claim_success'
  | 'not_qualified'
  | 'already_claimed';

export function ClaimTokenScreen() {
  const [step, setStep] = useState<ClaimTokenStep>('start_claim');
  const { data: walletClient } = useWalletClient();
  const [airdropInfo, setAirdropInfo] = useState<{
    contractAddress: string;
    claimableAmount: bigint;
    claimableAmountInEther: number;
    proofs: `0x${string}`[];
    airdropId: string;
  } | null>(null);
  const { address, chainId } = useAccount();
  const [donationPercentage, setDonationPercentage] = useState<DonationPercentage>('donate_half');
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);
  const [isGettingAirdropTokenStatus, setIsGettingAirdropTokenStatus] = useState(!!address);
  const { executeAsync: trackAirdropClaimPayout } = useAction(trackAirdropClaimPayoutAction, {
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error tracking airdrop claim payout');
    }
  });

  const { executeAsync } = useAction(getAirdropTokenStatusAction);

  const { switchChainAsync } = useSwitchChain();
  const { refreshBalance } = useDevTokenBalance({ address });

  // Move the check logic to a separate function
  const checkAirdropStatus = async (walletAddress: string) => {
    setIsGettingAirdropTokenStatus(true);
    try {
      const result = await executeAsync({ address: walletAddress });
      const data = result?.data;

      if (!data) {
        setStep('start_claim');
        return;
      }

      if (data.isClaimed) {
        setStep('already_claimed');
        return;
      }

      const _claimableAmount = BigInt(data.claimableAmount);
      if (_claimableAmount > 0) {
        setStep('show_claimable_tokens');
        setAirdropInfo({
          contractAddress: data.contractAddress,
          claimableAmount: _claimableAmount,
          claimableAmountInEther: Number(_claimableAmount / BigInt(10 ** 18)),
          proofs: data.proofs,
          airdropId: data.airdropId
        });
      } else {
        setStep('not_qualified');
      }
    } catch (error) {
      log.error('Error getting airdrop token status:', {
        error,
        address
      });
      setStep('start_claim');
    } finally {
      setIsGettingAirdropTokenStatus(false);
    }
  };

  const claimAirdropTokens = async () => {
    if (!walletClient) {
      return;
    }

    if (!airdropInfo) {
      return;
    }

    if (chainId !== base.id) {
      await switchChainAsync({
        chainId: base.id
      });
    }

    setIsClaimingTokens(true);

    try {
      const donationAmount =
        donationPercentage === 'donate_half'
          ? airdropInfo.claimableAmount / BigInt(2)
          : donationPercentage === 'donate_full'
            ? airdropInfo.claimableAmount
            : BigInt(0);

      let donationTxHash: string | null = null;

      const claimTxHash = await claimThirdwebERC20AirdropToken({
        airdropContractAddress: airdropInfo.contractAddress as `0x${string}`,
        receiver: address as `0x${string}`,
        quantity: airdropInfo.claimableAmount,
        proofs: airdropInfo.proofs,
        chainId: 8453,
        walletClient
      });

      if (donationAmount) {
        donationTxHash = await walletClient.writeContract({
          address: scoutTokenErc20ContractAddress(),
          abi: erc20Abi,
          functionName: 'transfer',
          args: [AIRDROP_SAFE_WALLET, donationAmount]
        });
      }

      setTimeout(() => {
        refreshBalance();
      }, 2500);

      await trackAirdropClaimPayout({
        address: address as `0x${string}`,
        claimAmount: airdropInfo.claimableAmount.toString(),
        airdropClaimId: airdropInfo.airdropId,
        donationAmount: donationAmount.toString(),
        claimTxHash,
        donationTxHash
      });

      setStep('token_claim_success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error claiming tokens';
      if (message.includes('denied')) {
        toast.error('User rejected the transaction');
      } else {
        toast.error(message);
      }
    } finally {
      setIsClaimingTokens(false);
    }
  };

  useEffect(() => {
    if (address) {
      checkAirdropStatus(address);
    } else {
      setStep('start_claim');
    }
  }, [address]); // Now we only depend on address

  if (step === 'start_claim') {
    return <StartClaimStep isLoading={isGettingAirdropTokenStatus} />;
  }

  if (step === 'not_qualified') {
    return <NotQualifiedStep />;
  }

  if (step === 'already_claimed') {
    return <AlreadyClaimedStep />;
  }

  if (step === 'show_claimable_tokens' && airdropInfo) {
    return (
      <ShowClaimableTokensStep
        onContinue={() => setStep('donation_selection')}
        claimableAmount={airdropInfo.claimableAmountInEther}
      />
    );
  }

  if (step === 'donation_selection' && airdropInfo) {
    return (
      <DonationSelectionStep
        claimableAmount={airdropInfo.claimableAmountInEther}
        donationPercentage={donationPercentage}
        onDonationChange={setDonationPercentage}
        onSelect={() => setStep('donation_confirmation')}
      />
    );
  }

  if (step === 'donation_confirmation' && airdropInfo) {
    return (
      <DonationConfirmationStep
        donationPercentage={donationPercentage}
        claimableAmount={airdropInfo.claimableAmountInEther}
        onCancel={() => setStep('donation_selection')}
        isLoading={isClaimingTokens}
        onClaim={claimAirdropTokens}
      />
    );
  }

  if (step === 'token_claim_success') {
    return <TokenClaimSuccessStep donationPercentage={donationPercentage} />;
  }

  return null;
}
