import 'server-only';

import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';
import { getBuilders } from '@packages/scoutgame/builders/getBuilders';
import { getRankedNewScoutsForCurrentWeek } from '@packages/scoutgame/scouts/getNewScouts';
import { getScouts, type ScoutsSortBy } from '@packages/scoutgame/scouts/getScouts';

import { BuildersTable } from './components/BuildersTable';
import { ScoutsTable } from './components/ScoutsTable';

export async function ScoutPageTable({
  tab,
  order,
  sort,
  userId
}: {
  userId?: string;
  tab: string;
  order?: string;
  sort?: string;
}) {
  if (tab === 'builders') {
    const [, builders = []] = await safeAwaitSSRData(
      getBuilders({
        limit: 200,
        sortBy: sort as BuildersSortBy,
        order: order as 'asc' | 'desc',
        loggedInScoutId: userId
      })
    );
    return <BuildersTable builders={builders} order={order ?? 'desc'} sort={(sort as BuildersSortBy) ?? 'week_gems'} />;
  } else if (tab === 'scouts') {
    const [, scouts = []] = await safeAwaitSSRData(
      getScouts({ limit: 200, sortBy: sort as ScoutsSortBy, order: order as 'asc' | 'desc' })
    );
    return <ScoutsTable scouts={scouts} order={order ?? 'asc'} sort={sort ?? 'rank'} />;
  }

  return null;
}
