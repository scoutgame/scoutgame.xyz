'use client';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, Card, Stack, styled, Typography } from '@mui/material';
import { shortenHex } from '@packages/utils/strings';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

const DEV_TOKEN_AMOUNT = 2500;

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: 'fit-content',
  padding: theme.spacing(2),
  borderRadius: '15px',
  borderWidth: theme.spacing(0.25),
  borderColor: theme.palette.primary.main,
  flex: 1,
  flexDirection: 'column',
  gap: theme.spacing(1),
  display: 'flex',
  cursor: 'pointer',
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.paper,
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: 200,
    easing: 'ease-in-out'
  }),
  '&:hover': selected
    ? undefined
    : {
        transition: theme.transitions.create(['background-color', 'border-color'], {
          duration: 200,
          easing: 'ease-in-out'
        }),
        backgroundColor: theme.palette.background.light
      }
}));

export function ClaimToken() {
  const [step, setStep] = useState<'start' | 'continue' | 'choose' | 'confirm' | 'play'>('start');
  const [donationPercentage, setDonationPercentage] = useState<'donate_full' | 'donate_half' | 'donate_none'>(
    'donate_half'
  );

  const { address = '0x1234566789012345678901234567890123456789' } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (address) {
      setStep('continue');
    }
  }, [address]);

  if (step === 'start') {
    return (
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' px={8} mb={4}>
        <Stack gap={2} flex={1}>
          <Typography variant='h4' color='secondary'>
            Claim period for <br />
            Season 1 Rewards is OPEN!
          </Typography>
          <Typography variant='h6'>
            If you earned points in the Preaseason, you've <br />
            secured your place in the airdrop! Claim your DEV <br />
            tokens at the start of each season for the next 10 <br />
            seasons.
          </Typography>
          <Link href='/login'>
            <Button sx={{ width: 'fit-content' }}>Start</Button>
          </Link>
        </Stack>
        <Image src='/images/hero.png' alt='Airdrop Banner' width={350} height={350} style={{ borderRadius: '10px' }} />
      </Stack>
    );
  }

  if (step === 'continue') {
    return (
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' px={8} mb={4}>
        <Stack gap={1} alignItems='center' flex={1}>
          <Stack>
            <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
              Congratulations
            </Typography>
            <Typography variant='h5' textAlign='center' fontWeight={400} color='secondary'>
              for being AWESOME.
            </Typography>
          </Stack>
          <Typography variant='h6' textAlign='center'>
            You have earned DEV tokens!
          </Typography>
          <Stack
            sx={{
              borderColor: 'text.disabled',
              borderWidth: '1px',
              borderStyle: 'solid',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              borderRadius: '15px',
              px: 1,
              py: 0.5,
              width: 'fit-content'
            }}
          >
            <AccountBalanceWalletOutlinedIcon fontSize='small' color='disabled' />
            <Typography variant='subtitle2' color='textDisabled'>
              Connected: {shortenHex(address, 4)}
            </Typography>
          </Stack>
          <Stack flexDirection='row' gap={1} alignItems='center' my={1}>
            <Typography variant='h4' fontWeight={600}>
              {DEV_TOKEN_AMOUNT}
            </Typography>
            <Image src='/images/dev-token-logo.png' alt='DEV Icon' width={35} height={35} />
          </Stack>
          <Button variant='contained' sx={{ width: 'fit-content' }} onClick={() => setStep('choose')}>
            Continue
          </Button>
        </Stack>
        <Image src='/images/hero.png' alt='Airdrop Banner' width={350} height={350} style={{ borderRadius: '10px' }} />
      </Stack>
    );
  }

  if (step === 'choose') {
    return (
      <Stack gap={3} alignItems='center'>
        <Typography variant='h5' color='secondary'>
          How would you like your {DEV_TOKEN_AMOUNT} DEV tokens?
        </Typography>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <StyledCard
            selected={donationPercentage === 'donate_full'}
            onClick={() => setDonationPercentage('donate_full')}
          >
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/quest-icon.svg' alt='Donate Full Icon' width={45} height={45} />
              <Typography variant='h5' fontWeight={600}>
                Donate 100% to Open Source
              </Typography>
            </Stack>
            <Typography>
              This will donate all of your DEV tokens to the Scout Game Open Source Grants program. This makes you an
              Open Source Legend.
            </Typography>
          </StyledCard>
          <StyledCard
            selected={donationPercentage === 'donate_half'}
            onClick={() => setDonationPercentage('donate_half')}
          >
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/quest-icon.svg' alt='Donate Full Icon' width={75} height={75} />
              <Typography variant='h5' fontWeight={600}>
                Donate 50% & Keep 50%
              </Typography>
              <Image src='/images/scout-icon.svg' alt='Scout Icon' width={75} height={75} />
            </Stack>
            <Typography>
              Donate half of your DEV tokens to the Grants program and keep half of it to play the game.
            </Typography>
          </StyledCard>
          <StyledCard
            selected={donationPercentage === 'donate_none'}
            onClick={() => setDonationPercentage('donate_none')}
          >
            <Stack flexDirection='row' gap={1} alignItems='center'>
              <Image src='/images/scout-icon.svg' alt='Scout Icon' width={75} height={75} />
              <Typography variant='h5' fontWeight={600}>
                Keep 100% to play
              </Typography>
            </Stack>
            <Typography>Use your DEV tokens to Draft hardworking developers and rake in the rewards!</Typography>
          </StyledCard>
        </Stack>
        <Button variant='contained' sx={{ width: 'fit-content' }} onClick={() => setStep('confirm')}>
          Select
        </Button>
      </Stack>
    );
  }

  if (step === 'confirm') {
    const donationAmount =
      donationPercentage === 'donate_full'
        ? DEV_TOKEN_AMOUNT
        : donationPercentage === 'donate_half'
          ? DEV_TOKEN_AMOUNT / 2
          : 0;
    const playAmount = DEV_TOKEN_AMOUNT - donationAmount;

    return (
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' px={8} mb={4}>
        <Stack flex={1} gap={4} justifyContent='center' alignItems='center'>
          <Typography variant='h5' color='secondary'>
            Your Selection
          </Typography>
          <Stack flexDirection='row' gap={10} alignItems='center'>
            {donationAmount ? (
              <Stack gap={1.5} alignItems='center'>
                <Image src='/images/quest-icon-primary.svg' alt='Quest Icon' width={75} height={75} />
                <Typography variant='h6' textAlign='center'>
                  Donate {donationPercentage === 'donate_full' ? '100%' : '50%'} <br />
                  to Open Source
                </Typography>
                <Stack flexDirection='row' gap={1} alignItems='center'>
                  <Typography variant='h4' fontWeight={600}>
                    {donationAmount}
                  </Typography>
                  <Image src='/images/dev-token-logo.png' alt='DEV Icon' width={35} height={35} />
                </Stack>
                {donationPercentage !== 'donate_full' ? (
                  <Button variant='outlined' sx={{ width: 150, mt: 2 }} onClick={() => setStep('choose')}>
                    Cancel
                  </Button>
                ) : null}
              </Stack>
            ) : null}

            {playAmount ? (
              <Stack gap={1.5} alignItems='center'>
                <Image src='/images/scout-icon-primary.svg' alt='Scout Icon' width={75} height={75} />
                <Typography variant='h6' textAlign='center'>
                  Claim {donationPercentage === 'donate_none' ? '100%' : '50%'} <br />
                  to Play
                </Typography>
                <Stack flexDirection='row' gap={1} alignItems='center'>
                  <Typography variant='h4' fontWeight={600}>
                    {playAmount}
                  </Typography>
                  <Image src='/images/dev-token-logo.png' alt='DEV Icon' width={35} height={35} />
                </Stack>
                {donationPercentage !== 'donate_none' ? (
                  <Button variant='contained' sx={{ width: 150, mt: 2 }} onClick={() => setStep('play')}>
                    Claim
                  </Button>
                ) : null}
              </Stack>
            ) : null}
          </Stack>

          {donationPercentage !== 'donate_half' ? (
            <Stack flexDirection='row' gap={4} alignItems='center'>
              <Button variant='outlined' sx={{ width: 150 }} onClick={() => setStep('choose')}>
                Cancel
              </Button>
              <Button variant='contained' sx={{ width: 150 }} onClick={() => setStep('play')}>
                Claim
              </Button>
            </Stack>
          ) : null}
        </Stack>
        <Image
          src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
          alt='Scout Switch'
          width={350}
          height={350}
        />
      </Stack>
    );
  }

  if (step === 'play') {
    return (
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' px={8} mb={4}>
        <Stack flex={1} justifyContent='center' alignItems='center' flexDirection='row'>
          {donationPercentage === 'donate_half' ? (
            <Stack gap={2} alignItems='center'>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                <Typography variant='h4' fontWeight={600} color='secondary'>
                  Claim successful!
                </Typography>
                <CheckCircleIcon color='secondary' />
              </Stack>
              <Typography variant='h5' textAlign='center'>
                THANK YOU <br />
                for your donation!
              </Typography>
              <Typography variant='h6' textAlign='center'>
                Now, let's go Bid on some developers and <br /> build your team before the season begins!
              </Typography>
              <Link href='https://draft.scoutgame.xyz' style={{ marginTop: 20 }}>
                <Button variant='contained' sx={{ width: 150 }}>
                  Play
                </Button>
              </Link>
            </Stack>
          ) : donationPercentage === 'donate_none' ? (
            <Stack gap={2} alignItems='center'>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                <Typography variant='h4' fontWeight={600} color='secondary'>
                  Claim successful!
                </Typography>
                <CheckCircleIcon color='secondary' />
              </Stack>
              <Typography variant='h6' textAlign='center'>
                Now, let's go Bid on some <br /> developers and build your team <br /> before the season begins!
              </Typography>
              <Link href='https://draft.scoutgame.xyz' style={{ marginTop: 20 }}>
                <Button variant='contained' sx={{ width: 150 }}>
                  Play
                </Button>
              </Link>
            </Stack>
          ) : (
            <Stack gap={2} alignItems='center'>
              <Typography variant='h4' fontWeight={600} color='secondary'>
                THANK YOU for your donation!
              </Typography>
              <Typography variant='h5' textAlign='center'>
                You are an <br />
                Open Source LEGEND!
              </Typography>
              <Typography variant='h6' textAlign='center'>
                Now, let's go Bid on some developers and <br /> build your team before the season begins!
              </Typography>
              <Link href='https://draft.scoutgame.xyz' style={{ marginTop: 20 }}>
                <Button variant='contained' sx={{ width: 150 }}>
                  Play
                </Button>
              </Link>
            </Stack>
          )}
        </Stack>
        <Image
          src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
          alt='Scout Switch'
          width={350}
          height={350}
        />
      </Stack>
    );
  }
}
