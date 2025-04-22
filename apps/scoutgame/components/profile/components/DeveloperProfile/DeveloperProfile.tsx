import 'server-only';

import { prisma } from '@charmverse/core/prisma-client';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getBuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import { getBuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import { appealUrl } from '@packages/scoutgame/constants';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { JoinGithubButton } from '@packages/scoutgame-ui/components/common/JoinGithubButton';
import type { BuilderUserInfo } from '@packages/users/interfaces';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';

import { DeveloperActivitiesList } from './DeveloperActivitiesList';
import { DeveloperStats } from './DeveloperStats';
import { DeveloperWeeklyStats } from './DeveloperWeeklyStats';

export async function DeveloperProfile({ builder }: { builder: BuilderUserInfo }) {
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

  if (!builder.githubLogin) {
    return (
      <Stack alignItems='center' gap={4} pt={4} data-test='developer-profile-no-github'>
        <Image
          src='/images/github-logo.png'
          alt=''
          width={740}
          height={181}
          style={{ width: '100%', height: 'auto', maxWidth: '200px' }}
        />
        <Typography>Connect your GitHub account to apply as a Developer.</Typography>
        <Suspense>
          <JoinGithubButton />
        </Suspense>
      </Stack>
    );
  }

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
      <DeveloperStats
        nftImageUrl={builderNft?.imageUrl}
        path={builder.path}
        builderPoints={builderStats?.seasonPoints}
        totalScouts={totalScouts}
        totalNftsSold={totalNftsSold}
        currentNftPrice={Number(builderNft?.currentPriceDevToken || 0) / 10 ** devTokenDecimals}
      />
      <Stack gap={0.5}>
        <Typography color='secondary'>This Week</Typography>
        <DeveloperWeeklyStats gemsCollected={builderStats?.gemsCollected} rank={builderStats?.rank} />
      </Stack>
      <Stack gap={0.5}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography color='secondary'>Recent Activity</Typography>
        </Stack>
        <Box maxHeight={{ md: '400px' }} overflow='auto'>
          {builderActivities.length > 0 ? (
            <DeveloperActivitiesList activities={builderActivities} />
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
