import 'server-only';

import { Stack } from '@mui/material';
import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDevelopersForTable } from '@packages/scoutgame/builders/getDevelopersForTable';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { AllDevelopersTableContainer } from './AllDevelopersTableContainer';

export async function AllDevelopersTableServer({ userId }: { userId?: string }) {
  const [error, data = { developers: [], nextCursor: null }] = await safeAwaitSSRData(
    getDevelopersForTable({
      sortBy: 'level',
      order: 'desc',
      loggedInScoutId: userId,
      nftType: 'default'
    })
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  return (
    <AllDevelopersTableContainer
      initialDevelopers={data.developers}
      initialCursor={data.nextCursor}
      order='desc'
      sortBy='level'
    />
  );
}
