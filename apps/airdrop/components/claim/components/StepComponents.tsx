import { Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';

import { WalletAddress, PlayButton } from './ClaimComponents';
import { PageLayout } from './PageLayout';

interface StartStepProps {
  isDesktop: boolean;
}

export function StartStep({ isDesktop }: StartStepProps) {
  return (
    <PageLayout imageSrc='/images/hero.png' imageAlt='Airdrop Banner' isDesktop={isDesktop}>
      <Stack
        gap={2}
        flex={1}
        alignItems={{
          xs: 'center',
          md: 'flex-start'
        }}
      >
        <Typography
          variant='h4'
          color='secondary'
          textAlign={{
            xs: 'center',
            md: 'left'
          }}
          mt={{
            xs: 2,
            md: 0
          }}
        >
          Claim period for <br />
          Season 1 Rewards is OPEN!
        </Typography>
        {isDesktop ? (
          <Typography variant='h6'>
            If you earned points in the Preaseason, you've <br />
            secured your place in the airdrop! Claim your DEV <br />
            tokens at the start of each season for the next 10 <br />
            seasons.
          </Typography>
        ) : (
          <Typography>
            If you earned points in the Preaseasons, you've secured your place in the airdrop! Claim your DEV tokens at
            the start of each season for the next 10 seasons.
          </Typography>
        )}
        <Link href='/login'>
          <Button sx={{ width: 'fit-content' }}>Start</Button>
        </Link>
      </Stack>
    </PageLayout>
  );
}

interface NotQualifiedStepProps {
  isDesktop: boolean;
  address: string;
}

export function NotQualifiedStep({ isDesktop, address }: NotQualifiedStepProps) {
  return (
    <PageLayout imageSrc='/images/scout-switch.png' imageAlt='Airdrop Banner' isDesktop={isDesktop}>
      <Stack gap={1} alignItems='center' flex={1}>
        <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
          Hey, there's always <br />
          next season!
        </Typography>
        <Typography variant='h6' textAlign='center'>
          You did not qualify this time around.
        </Typography>
        <WalletAddress address={address} />
        {isDesktop ? (
          <Typography variant='h6' textAlign='center' fontWeight={400}>
            Play this season to earn your spot in the next <br /> airdrop. Get started by drafting Developers <br />{' '}
            before the season officially begins!
          </Typography>
        ) : (
          <Typography>
            Play this season to earn your spot in the next airdrop. Get started by drafting Developers before the season
            officially begins!
          </Typography>
        )}
        <PlayButton isDesktop={isDesktop} />
      </Stack>
    </PageLayout>
  );
}

interface AlreadyClaimedStepProps {
  isDesktop: boolean;
  address: string;
}

export function AlreadyClaimedStep({ isDesktop, address }: AlreadyClaimedStepProps) {
  return (
    <PageLayout imageSrc='/images/scout-switch.png' imageAlt='Airdrop Banner' isDesktop={isDesktop}>
      <Stack gap={1} alignItems='center' flex={1}>
        <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
          That's all until next season!
        </Typography>
        <Typography variant='h6' textAlign='center'>
          You already claimed this season's airdrop.
        </Typography>
        <WalletAddress address={address} />
        {isDesktop ? (
          <Typography variant='h6' textAlign='center' fontWeight={400}>
            Play this season to earn your spot in the next <br /> airdrop. Get started by drafting Developers <br />{' '}
            before the season officially begins!
          </Typography>
        ) : (
          <Typography>
            Play this season to earn your spot in the next airdrop. Get started by drafting Developers before the season
            officially begins!
          </Typography>
        )}
        <PlayButton isDesktop={isDesktop} />
      </Stack>
    </PageLayout>
  );
}

interface ContinueStepProps {
  isDesktop: boolean;
  address: string;
  onContinue: () => void;
  devTokenAmount: number;
}

export function ContinueStep({ isDesktop, address, onContinue, devTokenAmount }: ContinueStepProps) {
  return (
    <PageLayout imageSrc='/images/hero.png' imageAlt='Airdrop Banner' isDesktop={isDesktop}>
      <Stack gap={1} alignItems='center' flex={1}>
        <Stack
          mt={{
            xs: 2,
            md: 0
          }}
        >
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
        <WalletAddress address={address} />
        <Stack flexDirection='row' gap={1} alignItems='center' my={1}>
          <Typography variant={isDesktop ? 'h4' : 'h5'} fontWeight={600}>
            {devTokenAmount}
          </Typography>
          <img
            src='/images/dev-token-logo.png'
            alt='DEV Icon'
            width={isDesktop ? 35 : 25}
            height={isDesktop ? 35 : 25}
          />
        </Stack>
        <Button variant='contained' sx={{ width: 'fit-content' }} onClick={onContinue}>
          Continue
        </Button>
      </Stack>
    </PageLayout>
  );
}
