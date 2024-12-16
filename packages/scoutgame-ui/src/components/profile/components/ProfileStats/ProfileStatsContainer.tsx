import 'server-only';

import { getUserStats } from '@packages/scoutgame/users/getUserStats';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ErrorSSRMessage } from '../../../common/ErrorSSRMessage';

import { ProfileStats } from './ProfileStats';

export async function ProfileStatsContainer({ userId }: { userId: string }) {
  const [, userStats] = await safeAwaitSSRData(getUserStats(userId));

  if (!userStats) {
    return <ErrorSSRMessage />;
  }

  return <ProfileStats {...userStats} />;
}
