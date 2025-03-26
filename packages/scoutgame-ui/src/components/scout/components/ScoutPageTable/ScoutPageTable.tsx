import 'server-only';

import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import type { DevelopersSortBy } from '@packages/scoutgame/builders/getDevelopersForTable';
import { getDevelopersForTable } from '@packages/scoutgame/builders/getDevelopersForTable';
import type { ScoutsSortBy } from '@packages/scoutgame/scouts/getPaginatedScouts';
import { getPaginatedScouts } from '@packages/scoutgame/scouts/getPaginatedScouts';

import { DevelopersTableContainer } from './components/DevelopersTableContainer';
import { ScoutsTableContainer } from './components/ScoutsTableContainer';

export async function ScoutPageTable({
  tab,
  order,
  sort,
  userId,
  nftType
}: {
  userId?: string;
  tab: string;
  order?: string;
  sort?: string;
  nftType: 'default' | 'starter';
}) {
  if (tab === 'builders') {
    const [, data = { developers: [], nextCursor: null }] = await safeAwaitSSRData(
      getDevelopersForTable({
        sortBy: sort as DevelopersSortBy,
        order: order as 'asc' | 'desc',
        loggedInScoutId: userId,
        nftType
      })
    );

    return (
      <DevelopersTableContainer
        initialDevelopers={data.developers}
        initialCursor={data.nextCursor}
        order={(order as 'asc' | 'desc') ?? 'desc'}
        sortBy={(sort as DevelopersSortBy) ?? 'week_gems'}
        nftType={nftType === 'default' ? 'default' : 'starter'}
      />
    );
  } else if (tab === 'scouts') {
    const [, data = { scouts: [], nextCursor: null }] = await safeAwaitSSRData(
      getPaginatedScouts({
        sortBy: sort as ScoutsSortBy,
        order: order as 'asc' | 'desc'
      })
    );

    return (
      <ScoutsTableContainer
        initialScouts={data.scouts}
        initialCursor={data.nextCursor}
        order={(order as 'asc' | 'desc') ?? 'asc'}
        sort={(sort as ScoutsSortBy) ?? 'rank'}
      />
    );
  }

  return null;
}
