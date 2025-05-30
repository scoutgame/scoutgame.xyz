import 'server-only';

import { Typography, Stack, Paper } from '@mui/material';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { getScoutStats } from '@packages/scoutgame/scouts/getScoutStats';
import { getUserSeasonStats } from '@packages/scoutgame/scouts/getUserSeasonStats';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { DevelopersGallery } from 'components/common/Gallery/DevelopersGallery';

import { ScoutStats } from './ScoutStats';

export async function ScoutProfile({ userId }: { userId: string }) {
  const [error, data] = await safeAwaitSSRData(
    Promise.all([
      getUserSeasonStats(userId),
      getScoutStats(userId),
      getScoutedBuilders({ loggedInScoutId: userId, scoutIdInView: userId })
    ])
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  const [seasonStats, { nftsPurchased }, scoutedBuilders] = data;

  return (
    <Stack gap={1}>
      <ScoutStats
        buildersScouted={scoutedBuilders.length}
        nftsPurchased={nftsPurchased}
        scoutPoints={seasonStats?.pointsEarnedAsScout}
      />
      <Stack>
        <Typography variant='h5' my={2} color='secondary' fontWeight='500'>
          Scouted Developers
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <DevelopersGallery
            showListButton
            builders={scoutedBuilders}
            columns={3}
            scoutInView={userId}
            size='small'
            markStarterCardPurchased
          />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>You haven't scouted any Developers yet. Start exploring and discover talent!</Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
