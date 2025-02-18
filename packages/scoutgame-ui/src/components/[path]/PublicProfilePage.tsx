import 'server-only';

import { BuilderNftType, type BuilderStatus } from '@charmverse/core/prisma-client';
import { Box, Stack, Paper } from '@mui/material';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { BackButton } from '../common/Button/BackButton';
import { Hidden } from '../common/Hidden';
import { UserProfile } from '../common/Profile/UserProfile';
import { ProjectsTab } from '../projects/components/ProjectsTab';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';

type UserProfile = BasicUserInfo & { displayName: string; builderStatus: BuilderStatus | null };

export function PublicProfilePage({
  scoutId,
  user,
  tab,
  scoutProjects
}: {
  scoutId?: string;
  user: UserProfile;
  tab: string;
  scoutProjects?: ScoutProjectMinimal[];
}) {
  return (
    <Box gap={2} display='flex' flexDirection='column' margin='auto'>
      <Hidden mdDown>
        <Paper sx={{ py: 2, mt: { xs: 1, md: 2 } }}>
          <Stack flexDirection='row' alignItems='center' pl={0.5}>
            <div>
              <BackButton />
            </div>
            <Box width='calc(100% - 50px)'>
              <UserProfile user={user} avatarSize='xLarge' />
            </Box>
          </Stack>
        </Paper>
        {scoutProjects && scoutProjects.length ? (
          <Box my={1}>
            <ProjectsTab scoutProjects={scoutProjects} />
          </Box>
        ) : null}
      </Hidden>
      <Box position='sticky' top={0} zIndex={1} bgcolor='background.default'>
        <PublicProfileTabsMenu
          tab={tab}
          path={user.path}
          isApprovedBuilder={user.builderStatus === 'approved' || user.builderStatus === 'banned'}
        />
      </Box>
      {tab === 'builder' ? (
        <PublicBuilderProfile scoutId={scoutId} builder={user} scoutProjects={scoutProjects} />
      ) : (
        <PublicScoutProfile publicUser={user} scoutProjects={scoutProjects} />
      )}
    </Box>
  );
}
