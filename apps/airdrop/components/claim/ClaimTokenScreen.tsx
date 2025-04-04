'use client';

import { claimThirdwebERC20AirdropToken } from '@packages/blockchain/airdrop/thirdwebERC20AirdropContract';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { base } from 'wagmi/chains';

import { AlreadyClaimedStep } from './components/AlreadyClaimedStep';
import { DonationConfirmationStep } from './components/DonationConfirmationStep';
import type { DonationPercentage } from './components/DonationSelectionStep';
import { DonationSelectionStep } from './components/DonationSelectionStep';
import { NotQualifiedStep } from './components/NotQualifiedStep';
import { ShowClaimableTokensStep } from './components/ShowClaimableTokensStep';
import { StartClaimStep } from './components/StartClaimStep';
import { TokenClaimSuccessStep } from './components/TokenClaimSuccessStep';

import { getAirdropTokenStatusAction } from '@/lib/getAirdropTokenStatusAction';
import { trackAirdropClaimPayoutAction } from '@/lib/trackAirdropClaimPayoutAction';

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
    claimableAmount: number;
    proofs: `0x${string}`[];
    airdropId: string;
    proofMaxQuantityForWallet: string;
  } | null>(null);
  const [donationPercentage, setDonationPercentage] = useState<DonationPercentage>('donate_half');
  const [isClaimingTokens, setIsClaimingTokens] = useState(false);

  const { executeAsync: trackAirdropClaimPayout } = useAction(trackAirdropClaimPayoutAction, {
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error tracking airdrop claim payout');
    }
  });

  const { executeAsync, isExecuting: isGettingAirdropTokenStatus } = useAction(getAirdropTokenStatusAction);

  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  // Move the check logic to a separate function
  const checkAirdropStatus = async (walletAddress: string) => {
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

    const _claimableAmount = Number(BigInt(data.claimableAmount) / BigInt(10 ** 18));
    if (_claimableAmount > 0) {
      setStep('show_claimable_tokens');
      setAirdropInfo({
        contractAddress: data.contractAddress,
        claimableAmount: _claimableAmount,
        proofs: data.proofs,
        airdropId: data.airdropId,
        proofMaxQuantityForWallet: data.proofMaxQuantityForWallet
      });
    } else {
      setStep('not_qualified');
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
      const preparedTx = await claimThirdwebERC20AirdropToken({
        airdropContractAddress: airdropInfo.contractAddress as `0x${string}`,
        receiver: address as `0x${string}`,
        quantity: BigInt(airdropInfo.claimableAmount * 10 ** 18),
        proofs: airdropInfo.proofs,
        proofMaxQuantityForWallet: BigInt(airdropInfo.proofMaxQuantityForWallet),
        chainId: 8453,
        walletClient
      });

      const donationAmount =
        donationPercentage === 'donate_half'
          ? airdropInfo.claimableAmount / 2
          : donationPercentage === 'donate_full'
            ? airdropInfo.claimableAmount
            : 0;

      await trackAirdropClaimPayout({
        address: address as `0x${string}`,
        amount: BigInt(airdropInfo.claimableAmount * 10 ** 18).toString(),
        airdropClaimId: airdropInfo.airdropId,
        donationAmount: BigInt(donationAmount * 10 ** 18).toString(),
        txHash: preparedTx
      });

      setStep('token_claim_success');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error claiming tokens');
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
        claimableAmount={airdropInfo.claimableAmount}
      />
    );
  }

  if (step === 'donation_selection' && airdropInfo) {
    return (
      <DonationSelectionStep
        claimableAmount={airdropInfo.claimableAmount}
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
        claimableAmount={airdropInfo.claimableAmount}
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
