'use client';

import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Stack, Paper, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { useMdScreen } from '../../../../hooks/useMediaScreens';
import { BackButton } from '../../../common/Button/BackButton';
import { BuildersGallery } from '../../../common/Gallery/BuildersGallery';
import { UserProfile } from '../../../common/Profile/UserProfile';
import { ProjectsTab } from '../../../projects/components/ProjectsTab';

import { PublicScoutProfileStats } from './PublicScoutProfileStats';

export type ScoutProfileProps = {
  scout: BasicUserInfo & {
    builderStatus?: BuilderStatus | null;
  };
  allTimePoints: number;
  seasonPoints: number;
  nftsPurchased: number;
  scoutedBuilders: BuilderInfo[];
  scoutProjects?: ScoutProjectMinimal[];
};

export function PublicScoutProfileContainer({
  scout,
  allTimePoints,
  seasonPoints,
  nftsPurchased,
  scoutedBuilders,
  scoutProjects
}: ScoutProfileProps) {
  const isDesktop = useMdScreen();
  return (
    <Box>
      {!isDesktop ? (
        <Paper sx={{ py: 2, mb: { xs: 1, md: 2 } }}>
          <Stack flexDirection='row'>
            <BackButton />
            <Box width='calc(100% - 50px)'>
              <UserProfile user={scout} avatarSize={isDesktop ? 'xLarge' : 'large'} />
            </Box>
          </Stack>
        </Paper>
      ) : null}
      {!isDesktop && scoutProjects && scoutProjects.length ? <ProjectsTab scoutProjects={scoutProjects} /> : null}
      <Paper
        sx={{
          my: 2,
          p: {
            xs: 0,
            md: 2
          },
          backgroundColor: {
            xs: 'transparent',
            md: 'background.dark'
          }
        }}
        elevation={0}
      >
        <PublicScoutProfileStats
          allTimePoints={allTimePoints}
          seasonPoints={seasonPoints}
          buildersScouted={scoutedBuilders.length}
          nftsPurchased={nftsPurchased}
        />
        <Typography variant='h6' my={2} color='secondary' fontWeight='500' textAlign='center'>
          Scouted Developers
        </Typography>
        {scoutedBuilders.length > 0 ? (
          <BuildersGallery
            scoutInView={scout.id}
            builders={scoutedBuilders}
            columns={5}
            size={isDesktop ? 'large' : 'small'}
          />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>This Scout hasn't discovered any Developers yet. Check back to see who they find!</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
