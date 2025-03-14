'use client';

import type { BuilderNftType, BuilderStatus } from '@charmverse/core/prisma';
import { Box, Paper, Stack, styled, Typography } from '@mui/material';
import type { BuilderActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import type { BuilderCardStats } from '@packages/scoutgame/builders/getBuilderCardStats';
import type { BuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import type { BuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import type { BasicUserInfo } from '@packages/users/interfaces';
import { getPlatform } from '@packages/utils/platform';

import { useLgScreen, useMdScreen } from '../../../../hooks/useMediaScreens';
import { BackButton } from '../../../common/Button/BackButton';
import { BuilderCard } from '../../../common/Card/BuilderCard/BuilderCard';
import { ScoutsGallery } from '../../../common/Gallery/ScoutsGallery';
import { UserProfile } from '../../../common/Profile/UserProfile';
import { ScoutButton } from '../../../common/ScoutButton/ScoutButton';
import { BuilderActivitiesList } from '../../../profile/components/BuilderProfile/BuilderActivitiesList';
import { BuilderWeeklyStats } from '../../../profile/components/BuilderProfile/BuilderWeeklyStats';
import { ProjectsTab } from '../../../projects/components/ProjectsTab';

import { PublicBuilderStats } from './PublicBuilderStats';

export type BuilderProfileProps = {
  builder: BasicUserInfo & {
    builderStatus: BuilderStatus | null;
  } & Omit<BuilderCardStats, 'starterPackSoldToScout'>;
  defaultNft: {
    imageUrl: string;
    currentPriceInScoutToken: string | null;
    currentPrice: bigint | null;
  } | null;
  starterPackNft: {
    imageUrl: string;
    currentPriceInScoutToken: string | null;
    currentPrice: bigint | null;
  } | null;
  builderActivities: BuilderActivity[];
  scoutProjects?: ScoutProjectMinimal[];
  starterPackSoldToScout: boolean;
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
  starterPackSoldToScout
}: BuilderProfileProps) {
  const platform = getPlatform();

  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
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
                      price:
                        platform === 'onchain_webapp'
                          ? BigInt(defaultNft?.currentPriceInScoutToken ?? 0)
                          : defaultNft?.currentPrice || BigInt(0)
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
                          price:
                            platform === 'onchain_webapp'
                              ? BigInt(starterPackNft.currentPriceInScoutToken ?? 0)
                              : starterPackNft.currentPrice || BigInt(0)
                        }}
                        showLabel
                        markStarterCardPurchased={starterPackSoldToScout}
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
                        price:
                          platform === 'onchain_webapp'
                            ? BigInt(defaultNft?.currentPriceInScoutToken ?? 0)
                            : defaultNft?.currentPrice || BigInt(0)
                      }}
                      showPurchaseButton
                      size={isLgScreen ? 'large' : 'medium'}
                    />
                    {starterPackNft && (
                      <Stack px={{ xs: 1, md: 0 }} pt={{ xs: 1, md: 2 }} pb={{ xs: 1, md: 0 }}>
                        <ScoutButton
                          builder={{
                            ...builder,
                            nftImageUrl: starterPackNft.imageUrl,
                            price:
                              platform === 'onchain_webapp'
                                ? BigInt(starterPackNft.currentPriceInScoutToken ?? 0)
                                : starterPackNft.currentPrice || BigInt(0)
                          }}
                          showLabel
                          markStarterCardPurchased={starterPackSoldToScout}
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
              <BuilderWeeklyStats gemsCollected={gemsCollected} rank={rank} />
            </Stack>
            <Stack gap={1}>
              <Typography color='secondary'>Recent Activity</Typography>
              <Box maxHeight={{ md: '400px' }} overflow='auto'>
                {builderActivities.length > 0 ? (
                  <BuilderActivitiesList activities={builderActivities} />
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
