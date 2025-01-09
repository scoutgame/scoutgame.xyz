import { Grid2 as Grid, Skeleton, Stack, Typography } from '@mui/material';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { getServerDate } from '@packages/scoutgame/utils/getServerDate';
import { DailyClaimCard } from '@packages/scoutgame-ui/components/quests/DailyClaimGallery/DailyClaimCard';
import dynamic from 'next/dynamic';

// A time based component needs to be rendered only on the client since the server and client will not match
const NextClaimCountdown = dynamic(
  () =>
    import('@packages/scoutgame-ui/components/quests/DailyClaimGallery/NextClaimCountdown').then(
      (mod) => mod.NextClaimCountdown
    ),
  {
    ssr: false,
    loading: () => <Skeleton animation='wave' height={24} width='50%' sx={{ mx: 'auto', my: 0.5 }} />
  }
);

export function DailyClaimGallery({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  const isSequential = isSequentialUpToToday(dailyClaims);

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} my={2}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Daily Claim
      </Typography>
      <NextClaimCountdown />
      <Grid container spacing={1} width='100%'>
        {dailyClaims.map((dailyClaim) => (
          <Grid size={dailyClaim.isBonus ? 8 : 4} key={`${dailyClaim.day}-${dailyClaim.isBonus}`}>
            <DailyClaimCard
              dailyClaim={dailyClaim}
              hasClaimedStreak={isSequential}
              canClaimBonus={
                isSequential &&
                !!dailyClaim.isBonus &&
                dailyClaims.some((item) => item.day === 7 && !item.isBonus && item.claimed)
              }
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

function isSequentialUpToToday(dailyClaims: DailyClaim[]) {
  const serverDate = getServerDate();
  const today = serverDate.weekday || 7; // Sunday returns 0, so we convert it to 7

  return dailyClaims
    .slice(0, today - 1)
    .map((claim) => claim.claimed)
    .every((bool) => bool);
}
