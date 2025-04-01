import { Stack, Typography } from '@mui/material';
import { Hidden } from '@packages/scoutgame-ui/components/common/Hidden';
import type { Friend } from '@packages/users/getFriends';

import { Info } from './components/Info';
import { InviteButtons } from './components/InviteButtons';
import { MyFriends } from './components/MyFriends';
import { Stats } from './components/Stats';

export function FriendlyQuest({
  friends,
  tokensEarned,
  title
}: {
  friends: Friend[];
  tokensEarned: number;
  title?: string;
}) {
  return (
    <Stack gap={2} py={{ md: 2 }} data-test='friendly-quest'>
      {title && (
        <Typography variant='h4' textAlign='center' color='secondary' fontWeight='600'>
          {title}
        </Typography>
      )}
      <Info />
      <InviteButtons friends={friends} stats={<Stats friendsJoined={friends.length} tokensEarned={tokensEarned} />} />
      <Hidden mdDown>
        <MyFriends friends={friends} title='My Friends' />
      </Hidden>
    </Stack>
  );
}
