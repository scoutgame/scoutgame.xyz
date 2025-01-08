import 'server-only';

import { Typography, Stack, Paper } from '@mui/material';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getBuildersWeeklyGemsAverage } from '@packages/scoutgame/gems/getBuildersWeeklyGemsAverage';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { getUserSeasonStats } from '@packages/scoutgame/scouts/getUserSeasonStats';

import { ErrorSSRMessage } from '../../../common/ErrorSSRMessage';
import { BuildersGallery } from '../../../common/Gallery/BuildersGallery';

import { ScoutStats } from './ScoutStats';

export async function ScoutProfile({ userId }: { userId: string }) {
  const [error, data] = await safeAwaitSSRData(
    Promise.all([getUserSeasonStats(userId), getScoutedBuilders({ scoutId: userId }), getBuildersWeeklyGemsAverage()])
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  const [seasonStats, scoutedBuilders, { averageGems }] = data;

  const nftsPurchasedThisSeason = scoutedBuilders.reduce((acc, builder) => acc + (builder.nftsSoldToScout || 0), 0);

  return (
    <Stack gap={1}>
      <ScoutStats
        buildersScouted={scoutedBuilders.length}
        nftsPurchased={nftsPurchasedThisSeason}
        scoutPoints={seasonStats?.pointsEarnedAsScout}
      />
      <Stack>
        <Typography variant='h5' my={2} color='secondary' fontWeight='500'>
          Scouted Builders
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <BuildersGallery
            dailyAverageGems={averageGems}
            builders={scoutedBuilders}
            columns={3}
            size='small'
            markStarterCardPurchased
          />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>You haven't scouted any Builders yet. Start exploring and discover talent!</Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
