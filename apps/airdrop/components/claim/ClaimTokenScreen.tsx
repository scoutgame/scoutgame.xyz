'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { AlreadyClaimedStep } from './components/AlreadyClaimedStep';
import { DonationConfirmationStep } from './components/DonationConfirmationStep';
import type { DonationPercentage } from './components/DonationSelectionStep';
import { DonationSelectionStep } from './components/DonationSelectionStep';
import { NotQualifiedStep } from './components/NotQualifiedStep';
import { ShowClaimableTokensStep } from './components/ShowClaimableTokensStep';
import { StartClaimStep } from './components/StartClaimStep';
import { TokenClaimSuccessStep } from './components/TokenClaimSuccessStep';

const DEV_TOKEN_AMOUNT = 2500;

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
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [notQualified, setNotQualified] = useState(false);

  const [donationPercentage, setDonationPercentage] = useState<DonationPercentage>('donate_half');

  const { address = '' } = useAccount();

  useEffect(() => {
    if (alreadyClaimed) {
      setStep('already_claimed');
    } else if (notQualified) {
      setStep('not_qualified');
    } else if (address) {
      setStep('show_claimable_tokens');
    } else {
      setStep('start_claim');
    }
  }, [address, alreadyClaimed, notQualified]);

  if (step === 'start_claim') {
    return <StartClaimStep />;
  }

  if (step === 'not_qualified') {
    return <NotQualifiedStep />;
  }

  if (step === 'already_claimed') {
    return <AlreadyClaimedStep />;
  }

  if (step === 'show_claimable_tokens') {
    return (
      <ShowClaimableTokensStep onContinue={() => setStep('donation_selection')} devTokenAmount={DEV_TOKEN_AMOUNT} />
    );
  }

  if (step === 'donation_selection') {
    return (
      <DonationSelectionStep
        devTokenAmount={DEV_TOKEN_AMOUNT}
        donationPercentage={donationPercentage}
        onDonationChange={setDonationPercentage}
        onSelect={() => setStep('donation_confirmation')}
      />
    );
  }

  if (step === 'donation_confirmation') {
    return (
      <DonationConfirmationStep
        donationPercentage={donationPercentage}
        devTokenAmount={DEV_TOKEN_AMOUNT}
        onCancel={() => setStep('donation_selection')}
        onClaim={() => setStep('token_claim_success')}
      />
    );
  }

  if (step === 'token_claim_success') {
    return <TokenClaimSuccessStep donationPercentage={donationPercentage} />;
  }
}
