import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import { LoadingComponent } from '@packages/scoutgame-ui/components/common/Loading/LoadingComponent';
import type { TalentProfile } from '@packages/users/getUserByPath';
import type { BuilderUserInfo } from '@packages/users/interfaces';
import { Suspense } from 'react';

import { ProjectsTab } from '../projects/components/ProjectsTab';

import { DeveloperProfile } from './components/DeveloperProfile/DeveloperProfile';
import { ProfileStatsContainer as ProfileStats } from './components/ProfileStats/ProfileStatsContainer';
import { ProfileTabsMenu } from './components/ProfileTabsMenu';
import { ScoutProfile } from './components/ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './components/ScoutProfile/ScoutProfileLoading';
import { UserProfileForm } from './components/UserProfileForm';

export type ProfileTab = 'build' | 'scout' | 'scout-build';

export type UserWithProfiles = SessionUser & {
  githubLogin?: string;
  talentProfile?: TalentProfile;
};

type ProfilePageProps = {
  user: UserWithProfiles;
  tab: ProfileTab;
  scoutProjects?: ScoutProjectMinimal[];
};

export function ProfilePage({ user, tab, scoutProjects }: ProfilePageProps) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto'
      }}
      data-test='profile-page'
    >
      <Stack
        gap={2}
        mt={2}
        flexDirection={{
          xs: 'column-reverse',
          md: 'column'
        }}
      >
        <ProfileTabsMenu tab={tab} />
        <Paper
          sx={{
            display: 'flex',
            p: {
              xs: 0,
              md: 2
            },
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: {
              xs: 'transparent',
              md: 'background.dark'
            }
          }}
          elevation={0}
        >
          <Stack gap={2} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
            <Stack justifyContent='center' flex={1}>
              <UserProfileForm user={user} />
            </Stack>
            <Box flex={1}>
              <Suspense fallback={<LoadingComponent isLoading />}>
                <ProfileStats userId={user.id} />
              </Suspense>
            </Box>
          </Stack>
          <Box my={1}>
            {scoutProjects && scoutProjects.length ? <ProjectsTab scoutProjects={scoutProjects} /> : null}
          </Box>
        </Paper>
      </Stack>
      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : <LoadingComponent isLoading />}>
        {tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <DeveloperProfile builder={user as BuilderUserInfo} />
        ) : (
          <Stack flexDirection='row' gap={2}>
            <Paper
              sx={{
                flex: 1,
                p: 2,
                backgroundColor: 'background.dark'
              }}
            >
              <Typography variant='h6' color='text.secondary'>
                Scout
              </Typography>
              <ScoutProfile userId={user.id} />
            </Paper>
            <Paper
              sx={{
                flex: 1,
                p: 2,
                backgroundColor: 'background.dark'
              }}
            >
              <Typography variant='h6' color='text.secondary'>
                Build
              </Typography>
              <DeveloperProfile builder={user as BuilderUserInfo} />
            </Paper>
          </Stack>
        )}
      </Suspense>
    </Box>
  );
}
