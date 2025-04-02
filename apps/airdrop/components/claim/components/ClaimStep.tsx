import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import Link from 'next/link';

import type { DonationPercentage } from './DonationStep';

export function PlayButton() {
  return (
    <Link href='https://draft.scoutgame.xyz'>
      <Button
        variant='contained'
        sx={{
          mt: {
            xs: 1,
            md: 2
          },
          width: 'fit-content'
        }}
      >
        Play
      </Button>
    </Link>
  );
}

type SuccessMessageProps = {
  donationPercentage: DonationPercentage;
};

export function SuccessMessage({ donationPercentage }: SuccessMessageProps) {
  const isDesktop = useMdScreen();

  return (
    <Stack
      gap={{
        xs: 1,
        md: 2
      }}
      alignItems='center'
    >
      {donationPercentage !== 'donate_full' && (
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography variant='h4' fontWeight={600} color='secondary'>
            Claim successful!
          </Typography>
          <CheckCircleIcon color='secondary' />
        </Stack>
      )}
      {donationPercentage === 'donate_full' ? (
        <>
          <Typography variant='h4' fontWeight={600} color='secondary'>
            THANK YOU for your donation!
          </Typography>
          <Typography variant='h5' textAlign='center'>
            You are an <br />
            Open Source LEGEND!
          </Typography>
        </>
      ) : (
        <Typography variant='h5' textAlign='center'>
          THANK YOU <br />
          for your donation!
        </Typography>
      )}
      {isDesktop ? (
        <Typography variant='h6' textAlign='center'>
          Now, let's go Bid on some developers and <br /> build your team before the season begins!
        </Typography>
      ) : (
        <Typography variant='h6' textAlign='center'>
          Now, let's go Bid on some developers and build your team before the season begins!
        </Typography>
      )}
      <PlayButton />
    </Stack>
  );
}
