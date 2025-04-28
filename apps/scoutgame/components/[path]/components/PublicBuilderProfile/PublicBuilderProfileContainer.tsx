'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { Box, Paper, Stack, styled, Typography } from '@mui/material';
import type { BuilderCardStats } from '@packages/scoutgame/builders/getBuilderCardStats';
import type { BuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import type { BuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import type { BuilderActivity } from '@packages/scoutgame/builders/getDeveloperActivities';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import { BackButton } from '@packages/scoutgame-ui/components/common/Button/BackButton';
import { UserProfile } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import { ScoutsGallery } from 'components/common/Gallery/ScoutsGallery';
import { ScoutButton } from 'components/common/ScoutButton/ScoutButton';
import { DeveloperActivitiesList } from 'components/profile/components/DeveloperProfile/DeveloperActivitiesList';
import { DeveloperWeeklyStats } from 'components/profile/components/DeveloperProfile/DeveloperWeeklyStats';
import { ProjectsTab } from 'components/projects/components/ProjectsTab';

import { PublicBuilderStats } from './PublicBuilderStats';

export type BuilderProfileProps = {
  builder: BasicUserInfo & {
    listings?: BuilderInfo['listings'];
    builderStatus: BuilderStatus | null;
  } & Omit<BuilderCardStats, 'starterNftSoldToLoggedInScout'>;
  defaultNft: {
    imageUrl: string;
    currentPrice: bigint | null;
  } | null;
  starterPackNft: {
    imageUrl: string;
    currentPrice: bigint | null;
  } | null;
  builderActivities: BuilderActivity[];
  scoutProjects?: ScoutProjectMinimal[];
  starterNftSoldToLoggedInScout: boolean;
} & BuilderStats &
  BuilderScouts;

const PaperContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  flex: 1,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
    // @ts-ignore
    backgroundColor: theme.palette.background.dark
  },
  [theme.breakpoints.down('md')]: {
    padding: 0,
    backgroundColor: 'transparent'
  }
}));

export function PublicBuilderProfileContainer({
  builder,
  defaultNft,
  starterPackNft,
  allTimePoints,
  seasonPoints,
  totalScouts,
  scouts,
  totalNftsSold,
  builderActivities,
  gemsCollected,
  rank,
  scoutProjects,
  starterNftSoldToLoggedInScout
}: BuilderProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      <Stack
        gap={2}
        mb={{
          xs: 1,
          md: 2
        }}
      >
        {!isDesktop ? (
          <Paper sx={{ py: 2 }}>
            <Stack flexDirection='row'>
              <BackButton />
              <Stack flexDirection='row' alignItems='center' gap={2}>
                <Box minWidth='fit-content'>
                  <BuilderCard
                    type='default'
                    builder={{
                      ...builder,
                      nftImageUrl: defaultNft?.imageUrl,
                      price: defaultNft?.currentPrice || BigInt(0)
                    }}
                    showPurchaseButton
                    size='small'
                  />
                  {starterPackNft && (
                    <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
                      <ScoutButton
                        builder={{
                          ...builder,
                          nftImageUrl: starterPackNft.imageUrl,
                          price: starterPackNft.currentPrice || BigInt(0)
                        }}
                        isStarterCard
                        markStarterCardPurchased={starterNftSoldToLoggedInScout}
                        type='starter_pack'
                      />
                    </Stack>
                  )}
                </Box>
                <Stack gap={1} pr={1}>
                  <UserProfile
                    user={{
                      ...builder,
                      avatar: null
                    }}
                  />
                  <PublicBuilderStats
                    allTimePoints={allTimePoints}
                    seasonPoints={seasonPoints}
                    totalScouts={totalScouts}
                    totalNftsSold={totalNftsSold}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        ) : null}
        {!isDesktop && scoutProjects && scoutProjects.length ? (
          <Box my={1}>
            <ProjectsTab scoutProjects={scoutProjects} />
          </Box>
        ) : null}

        <Stack
          gap={2}
          flexDirection={{
            xs: 'column-reverse',
            md: 'row'
          }}
        >
          <PaperContainer>
            <Stack gap={2} flex={1}>
              {isDesktop ? (
                <Paper
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    p: 4,
                    justifyContent: 'center'
                  }}
                >
                  <div>
                    <BuilderCard
                      type='default'
                      builder={{
                        ...builder,
                        nftImageUrl: defaultNft?.imageUrl,
                        price: defaultNft?.currentPrice || BigInt(0)
                      }}
                      showPurchaseButton
                    />
                    {starterPackNft && (
                      <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
                        <ScoutButton
                          builder={{
                            ...builder,
                            nftImageUrl: starterPackNft.imageUrl,
                            price: starterPackNft.currentPrice || BigInt(0)
                          }}
                          isStarterCard
                          markStarterCardPurchased={starterNftSoldToLoggedInScout}
                          type='starter_pack'
                        />
                      </Stack>
                    )}
                  </div>
                  <PublicBuilderStats
                    seasonPoints={seasonPoints}
                    allTimePoints={allTimePoints}
                    totalScouts={totalScouts}
                    totalNftsSold={totalNftsSold}
                  />
                </Paper>
              ) : null}
            </Stack>
            <Stack gap={1}>
              <Typography color='secondary'>Scouted By</Typography>
              {scouts.length > 0 ? (
                <ScoutsGallery scouts={scouts} />
              ) : (
                <Paper sx={{ p: 2 }}>
                  <Typography>
                    No Scouts have discovered this Developer yet. Be the first to support their journey!
                  </Typography>
                </Paper>
              )}
            </Stack>
          </PaperContainer>
          <PaperContainer>
            <Stack gap={1}>
              <Typography color='secondary'>This Week</Typography>
              <DeveloperWeeklyStats gemsCollected={gemsCollected} rank={rank} />
            </Stack>
            <Stack gap={1}>
              <Typography color='secondary'>Recent Activity</Typography>
              <Box maxHeight={{ md: '400px' }} overflow='auto'>
                {builderActivities.length > 0 ? (
                  <DeveloperActivitiesList activities={builderActivities} />
                ) : (
                  <Typography>No recent activity by this developer.</Typography>
                )}
              </Box>
            </Stack>
          </PaperContainer>
        </Stack>
      </Stack>
    </Box>
  );
}
