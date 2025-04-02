import { Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { ConnectedWalletDisplay } from './ConnectedWalletDisplay';
import { PageLayout } from './PageLayout';
import { PlayButton } from './PlayButton';

export function NotQualifiedStep() {
  const isDesktop = useMdScreen();

  return (
    <PageLayout imageSrc='/images/scout-switch.png' imageAlt='Airdrop Banner'>
      <Stack gap={1} alignItems='center' flex={1}>
        <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
          Hey, there's always <br />
          next season!
        </Typography>
        <Typography variant='h6' textAlign='center'>
          You did not qualify this time around.
        </Typography>
        <ConnectedWalletDisplay />
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
        <PlayButton />
      </Stack>
    </PageLayout>
  );
}
