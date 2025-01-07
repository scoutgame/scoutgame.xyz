import { Box, Paper, Stack, Typography } from '@mui/material';
import type { SessionUser } from '@packages/nextjs/session/interfaces';
import type { TalentProfile } from '@packages/users/getUserByPath';
import type { BuilderUserInfo } from '@packages/users/interfaces';
import { Suspense } from 'react';

import { LoadingComponent } from '../common/Loading/LoadingComponent';

import { BuilderProfile } from './components/BuilderProfile/BuilderProfile';
import { ProfileStatsContainer as ProfileStats } from './components/ProfileStats/ProfileStatsContainer';
import { ProfileTabsMenu } from './components/ProfileTabsMenu';
import { ScoutProfile } from './components/ScoutProfile/ScoutProfile';
import { ScoutProfileLoading } from './components/ScoutProfile/ScoutProfileLoading';
import { UserProfileForm } from './components/UserProfileForm';

export type ProfileTab = 'build' | 'scout' | 'scout-build';

export type UserWithProfiles = SessionUser & {
  githubLogin?: string;
  talentProfile?: TalentProfile;
  hasMoxieProfile: boolean;
};

type ProfilePageProps = {
  user: UserWithProfiles;
  tab: ProfileTab;
  hideGithubButton?: boolean;
};

export function ProfilePage({ user, tab, hideGithubButton }: ProfilePageProps) {
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
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            backgroundColor: {
              xs: 'transparent',
              md: 'background.dark'
            }
          }}
          elevation={0}
        >
          <Stack justifyContent='center' flex={1}>
            <UserProfileForm user={user} />
          </Stack>
          <Box flex={1}>
            <Suspense fallback={<LoadingComponent isLoading />}>
              <ProfileStats userId={user.id} />
            </Suspense>
          </Box>
        </Paper>
      </Stack>
      <Suspense fallback={tab === 'scout' ? <ScoutProfileLoading /> : <LoadingComponent isLoading />}>
        {tab === 'scout' ? (
          <ScoutProfile userId={user.id} />
        ) : tab === 'build' ? (
          <BuilderProfile builder={user as BuilderUserInfo} />
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
              <BuilderProfile hideGithubButton={hideGithubButton} builder={user as BuilderUserInfo} />
            </Paper>
          </Stack>
        )}
      </Suspense>
    </Box>
  );
}
