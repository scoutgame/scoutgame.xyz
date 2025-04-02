'use client';

import { Stack } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { SuccessMessage } from './components/ClaimStep';
import { DonationSelection, DonationConfirmation } from './components/DonationStep';
import { StartStep, NotQualifiedStep, AlreadyClaimedStep, ContinueStep } from './components/StepComponents';

const DEV_TOKEN_AMOUNT = 2500;

export function ClaimToken() {
  const [step, setStep] = useState<
    'start' | 'continue' | 'choose' | 'confirm' | 'play' | 'not_qualified' | 'already_claimed'
  >('continue');

  const [donationPercentage, setDonationPercentage] = useState<'donate_full' | 'donate_half' | 'donate_none'>(
    'donate_half'
  );

  const { address = '' } = useAccount();
  const isDesktop = useMdScreen();

  useEffect(() => {
    if (address) {
      setStep('continue');
    } else {
      setStep('start');
    }
  }, [address]);

  if (step === 'start') {
    return <StartStep />;
  }

  if (step === 'not_qualified') {
    return <NotQualifiedStep />;
  }

  if (step === 'already_claimed') {
    return <AlreadyClaimedStep />;
  }

  if (step === 'continue') {
    return <ContinueStep onContinue={() => setStep('choose')} devTokenAmount={DEV_TOKEN_AMOUNT} />;
  }

  if (step === 'choose') {
    return (
      <DonationSelection
        devTokenAmount={DEV_TOKEN_AMOUNT}
        donationPercentage={donationPercentage}
        onDonationChange={setDonationPercentage}
        onSelect={() => setStep('confirm')}
      />
    );
  }

  if (step === 'confirm') {
    return (
      <DonationConfirmation
        donationPercentage={donationPercentage}
        devTokenAmount={DEV_TOKEN_AMOUNT}
        onCancel={() => setStep('choose')}
        onClaim={() => setStep('play')}
      />
    );
  }

  if (step === 'play') {
    return (
      <Stack
        flexDirection={{
          xs: 'column-reverse',
          md: 'row'
        }}
        justifyContent='space-between'
        alignItems='center'
        px={{
          xs: 2,
          md: 8
        }}
        mb={{
          xs: 2,
          md: 4
        }}
      >
        <Stack flex={1} justifyContent='center' alignItems='center' flexDirection='row'>
          <SuccessMessage donationPercentage={donationPercentage} />
        </Stack>
        <img
          src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
          alt='Scout Switch'
          width={isDesktop ? 350 : 300}
          height={isDesktop ? 350 : 300}
        />
      </Stack>
    );
  }
}
