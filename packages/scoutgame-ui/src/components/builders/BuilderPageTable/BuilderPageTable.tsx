import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { getLeaderboard } from '@packages/scoutgame/builders/getLeaderboard';

import { ScoutPageTable } from '../../scout/components/ScoutPageTable/ScoutPageTable';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';

export async function BuilderPageTable({
  tab,
  week,
  builderSort,
  builderOrder,
  userId
}: {
  tab: string;
  week: string;
  builderSort?: BuildersSortBy;
  builderOrder?: string;
  userId?: string;
}) {
  if (tab === 'activity') {
    const [, activities = []] = await safeAwaitSSRData(getBuilderActivities({ limit: 100 }));
    return <ActivityTable activities={activities} />;
  }

  if (tab === 'leaderboard') {
    const [, leaderboard = []] = await safeAwaitSSRData(getLeaderboard({ limit: 200, week }));
    if (leaderboard.length > 0) {
      return <LeaderboardTable data={leaderboard} week={week} />;
    }
    // empty state
    else {
      return (
        <ScoutPageTable tab='builders' sort={builderSort} order={builderOrder} userId={userId} nftType='default' />
      );
    }
  }
  return null;
}
