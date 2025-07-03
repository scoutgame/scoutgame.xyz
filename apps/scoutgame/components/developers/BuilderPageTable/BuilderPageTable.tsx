import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { getDeveloperActivities } from '@packages/scoutgame/builders/getDeveloperActivities';
import { getLeaderboard } from '@packages/scoutgame/builders/getLeaderboard';
import { getScoutPartnersInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';

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
    const [[, activities = []], [, scoutPartners = []]] = await Promise.all([
      safeAwaitSSRData(getDeveloperActivities({ limit: 100 })),
      safeAwaitSSRData(getScoutPartnersInfo())
    ]);
    return <ActivityTable activities={activities} scoutPartners={scoutPartners} />;
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
