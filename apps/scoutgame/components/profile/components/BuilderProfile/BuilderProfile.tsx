import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getBuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import { getBuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import { appealUrl } from '@packages/scoutgame/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { JoinGithubButton } from '@packages/scoutgame-ui/components/common/JoinGithubButton';
import type { BuilderUserInfo } from '@packages/users/interfaces';
import { isOnchainPlatform } from '@packages/utils/platform';
import Link from 'next/link';
import { Suspense } from 'react';

import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';

import { BuilderActivitiesList } from './BuilderActivitiesList';
import { BuilderStats } from './BuilderStats';
import { BuilderWeeklyStats } from './BuilderWeeklyStats';

export async function BuilderProfile({ builder }: { builder: BuilderUserInfo }) {
  const [builderNft, builderStats, builderActivities = [], { scouts = [], totalNftsSold = 0, totalScouts = 0 } = {}] =
    builder.builderStatus === 'approved'
      ? await Promise.all([
          prisma.builderNft.findUnique({
            where: {
              builderId_season_nftType: {
                builderId: builder.id,
                season: getCurrentSeasonStart(),
                nftType: 'default'
              }
            },
            select: {
              imageUrl: true,
              currentPriceDevToken: true,
              currentPrice: true
            }
          }),
          getBuilderStats(builder.id),
          getBuilderActivities({ builderId: builder.id, limit: 200 }),
          getBuilderScouts(builder.id)
        ])
      : [];

  // if (!builder.githubLogin && !hideGithubButton) {
  //   return (
  //     <Stack gap={2} alignItems='center'>
  //       <Typography>Connect your GitHub account to apply as a Developer.</Typography>
  //       <Suspense>
  //         <JoinGithubButton />
  //       </Suspense>
  //     </Stack>
  //   );
  // }

  if (builder.builderStatus === 'applied') {
    return (
      <Box
        sx={{
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography align='center'>Your Developer account is pending approval.</Typography>
        <Typography align='center'>Check back soon!</Typography>
      </Box>
    );
  }

  if (builder.builderStatus === 'rejected') {
    return (
      <Stack gap={2} alignItems='center'>
        <Suspense>
          <Typography>
            Your Developer account was not approved. Connect your GitHub account again if you think this was a mistake.
            <JoinGithubButton />
          </Typography>
        </Suspense>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      {builder.builderStatus === 'banned' ? (
        <Alert severity='error'>
          <Typography>
            Your developer account has been banned. Submit an appeal for review{' '}
            <Typography color='secondary' component='span'>
              <Link href={appealUrl}>here</Link>
            </Typography>
            to get unbanned.
          </Typography>
        </Alert>
      ) : null}
      <BuilderStats
        nftImageUrl={builderNft?.imageUrl}
        path={builder.path}
        builderPoints={builderStats?.seasonPoints}
        totalScouts={totalScouts}
        totalNftsSold={totalNftsSold}
        currentNftPrice={
          isOnchainPlatform()
            ? Number(builderNft?.currentPriceDevToken || 0) / 10 ** devTokenDecimals
            : convertCostToPoints(builderNft?.currentPrice || BigInt(0))
        }
      />
      <Stack gap={0.5}>
        <Typography color='secondary'>This Week</Typography>
        <BuilderWeeklyStats gemsCollected={builderStats?.gemsCollected} rank={builderStats?.rank} />
      </Stack>
      <Stack gap={0.5}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography color='secondary'>Recent Activity</Typography>
        </Stack>
        <Box maxHeight={{ md: '400px' }} overflow='auto'>
          {builderActivities.length > 0 ? (
            <BuilderActivitiesList activities={builderActivities} />
          ) : (
            <Typography>No activity yet. Start contributing or scouting to build your profile!</Typography>
          )}
        </Box>
      </Stack>
      <Stack gap={0.5}>
        <Typography color='secondary'>Scouted By</Typography>
        {scouts.length > 0 ? (
          <ScoutsGallery scouts={scouts} />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>No Scouts have discovered you yet. Keep building and they'll find you!</Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
