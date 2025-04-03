import { Button, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { WalletLogin } from 'components/common/WalletLogin';

import { PageLayout } from './PageLayout';

export function StartClaimStep() {
  const isDesktop = useMdScreen();

  return (
    <PageLayout imageSrc='/images/hero.png' imageAlt='Airdrop Banner'>
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
        <WalletLogin text='Start' variant='contained' sx={{ width: 250, py: 1, borderRadius: 2 }} />
      </Stack>
    </PageLayout>
  );
}
