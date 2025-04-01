import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';
import { getUserStats } from '@packages/users/getUserStats';

import { ProfileStats } from './ProfileStats';

export async function ProfileStatsContainer({ userId }: { userId: string }) {
  const [, userStats] = await safeAwaitSSRData(getUserStats(userId));

  if (!userStats) {
    return <ErrorSSRMessage />;
  }

  return <ProfileStats {...userStats} />;
}
