import { Button, Stack, Typography } from '@mui/material';
import { WalletLogin } from '@packages/scoutgame-ui/components/common/WalletLogin/WalletLogin';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { PageLayout } from './PageLayout';

export function StartClaimStep({ isLoading }: { isLoading: boolean }) {
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
          Season 2 Rewards is OPEN!
        </Typography>
        {isDesktop ? (
          <Typography variant='h6'>
            Top Players from Season 1, you've secured your <br />
            place in the airdrop! Claim your DEV tokens at the <br />
            start of each season for the next 9 seasons.
          </Typography>
        ) : (
          <Typography>
            Top Players from Season 1, you've secured your place in the airdrop! Claim your DEV tokens at the start of
            each season for the next 9 seasons.
          </Typography>
        )}
        {isLoading ? (
          <Button variant='contained' loading sx={{ width: 250, py: 1, borderRadius: 2 }}>
            Start
          </Button>
        ) : (
          <WalletLogin text='Start' />
        )}
      </Stack>
    </PageLayout>
  );
}
