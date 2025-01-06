import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getLeaderboard } from '@packages/scoutgame/builders/getLeaderboard';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { ScoutPageTable } from '../../scout/ScoutPageTable/ScoutPageTable';

import { ActivityTable } from './components/ActivityTable';
import { LeaderboardTable } from './components/LeaderboardTable';

export async function BuilderPageTable({
  tab,
  week,
  builderSort,
  builderOrder
}: {
  tab: string;
  week: string;
  builderSort?: string;
  builderOrder?: string;
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
      return <ScoutPageTable tab='builders' sort={builderSort} order={builderOrder} />;
    }
  }
  return null;
}
