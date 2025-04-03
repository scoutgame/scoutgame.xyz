import { Typography, Stack } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { PageLayout } from './PageLayout';
import { PlayButton } from './PlayButton';

export function AlreadyClaimedStep() {
  const isDesktop = useMdScreen();
  return (
    <PageLayout imageSrc='/images/scout-switch.png' imageAlt='Airdrop Banner'>
      <Stack gap={1} alignItems='center' flex={1}>
        <Typography variant='h4' textAlign='center' fontWeight={600} color='secondary'>
          That's all until next season!
        </Typography>
        <Typography variant='h6' textAlign='center'>
          You already claimed this season's airdrop.
        </Typography>
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
