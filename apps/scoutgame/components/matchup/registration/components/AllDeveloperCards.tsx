import 'server-only';

import { Stack } from '@mui/material';
import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDevelopersForTable } from '@packages/scoutgame/builders/getDevelopersForTable';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';
import { ErrorSSRMessage } from '@packages/scoutgame-ui/components/common/ErrorSSRMessage';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { DevelopersTableContainer } from 'components/scout/components/ScoutPageTable/components/DevelopersTableContainer';

export async function AllDeveloperCards({
  userId,
  onSelectDeveloper
}: {
  userId?: string;
  onSelectDeveloper?: (developerId: string) => void;
}) {
  const [error, data = { developers: [], nextCursor: null }] = await safeAwaitSSRData(
    getDevelopersForTable({
      sortBy: 'level' as DevelopersSortBy,
      order: 'desc',
      loggedInScoutId: userId,
      nftType: 'default'
    })
  );

  if (error) {
    return <ErrorSSRMessage />;
  }

  return (
    <DevelopersTableContainer
      initialDevelopers={data.developers}
      initialCursor={data.nextCursor}
      order='desc'
      sortBy='level'
      nftType='default'
    />
  );
}
