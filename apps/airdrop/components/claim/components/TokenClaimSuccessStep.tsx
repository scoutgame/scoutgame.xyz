import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import type { DonationPercentage } from './DonationSelectionStep';
import { PlayButton } from './PlayButton';

export function TokenClaimSuccessStep({ donationPercentage }: { donationPercentage: DonationPercentage }) {
  const isDesktop = useMdScreen();

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
        <Stack
          gap={{
            xs: 1,
            md: 2
          }}
          flex={1}
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
              <Typography
                variant='h4'
                fontWeight={600}
                color='secondary'
                textAlign={{
                  xs: 'center',
                  md: 'left'
                }}
              >
                THANK YOU for your donation!
              </Typography>
              <Typography variant='h5' textAlign='center'>
                You are an <br />
                Open Source LEGEND!
              </Typography>
            </>
          ) : donationPercentage === 'donate_half' ? (
            <Typography variant='h5' textAlign='center'>
              THANK YOU <br />
              for your donation!
            </Typography>
          ) : null}
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
        {isDesktop ? (
          <img
            src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
            alt='Scout Switch'
            width={isDesktop ? 350 : 300}
            height={isDesktop ? 350 : 300}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
