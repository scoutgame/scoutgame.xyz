import 'server-only';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { Box, Stack, Paper } from '@mui/material';
import { BackButton } from '@packages/scoutgame-ui/components/common/Button/BackButton';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import { UserProfile } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';
import type { BasicUserInfo } from '@packages/users/interfaces';

import { PublicBuilderProfile } from './components/PublicBuilderProfile/PublicBuilderProfile';
import { PublicScoutProfile } from './components/PublicScoutProfile/PublicScoutProfile';
import { PublicProfileTabsMenu } from './PublicProfileTabsMenu';

type UserProfile = BasicUserInfo & { displayName: string; builderStatus: BuilderStatus | null };

export function PublicProfilePage({
  loggedInUserId,
  user,
  tab
}: {
  loggedInUserId?: string;
  user: UserProfile;
  tab: string;
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
      </Hidden>
      <Box position='sticky' top={0} zIndex={1} bgcolor='background.default'>
        <PublicProfileTabsMenu
          tab={tab}
          path={user.path}
          isApprovedBuilder={user.builderStatus === 'approved' || user.builderStatus === 'banned'}
        />
      </Box>
      {tab === 'builder' ? (
        <PublicBuilderProfile loggedInUserId={loggedInUserId} builder={user} />
      ) : (
        <PublicScoutProfile loggedInUserId={loggedInUserId} publicUser={user} />
      )}
    </Box>
  );
}
