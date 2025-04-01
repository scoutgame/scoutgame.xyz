import { Paper, Typography, Box } from '@mui/material';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { getSeasonBuilderRewards, getWeeklyBuilderRewards } from '@packages/scoutgame/builders/getBuilderRewards';
import Image from 'next/image';

import { BuilderRewardsTable } from './BuilderRewardsTable';

export async function BuilderRewardsTableContainer({ week, season }: { week: string | null; season: string }) {
  const user = await getUserFromSession();
  const isCurrentPeriod = season === getCurrentSeasonStart() || week === getCurrentWeek();
  if (!user) {
    return null;
  }

  const builderRewards = week
    ? await getWeeklyBuilderRewards({ week, userId: user.id })
    : await getSeasonBuilderRewards({ season, userId: user.id });

  const totalPoints = builderRewards.reduce((acc, reward) => acc + reward.points, 0);

  if (builderRewards.length === 0) {
    return (
      <Paper
        sx={{
          width: '100%',
          px: 2.5,
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          mt: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography>{isCurrentPeriod ? 'Time to scout some Developers!' : 'No rewards earned'}</Typography>
        <Box
          sx={{
            width: {
              md: '400px',
              xs: '250px'
            },
            height: {
              md: '400px',
              xs: '250px'
            }
          }}
        >
          <Image
            src='/images/cat-with-binoculars.png'
            alt='Scouts'
            width={400}
            height={400}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      </Paper>
    );
  }

  return <BuilderRewardsTable week={week} builderRewards={builderRewards} totalPoints={totalPoints} />;
}
