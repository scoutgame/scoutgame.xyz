import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPaginatedBuilders } from '@packages/scoutgame/builders/getPaginatedBuilders';
import { getBuildersWeeklyGemsAverage } from '@packages/scoutgame/gems/getBuildersWeeklyGemsAverage';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export async function ScoutPageBuildersGallery({ showHotIcon }: { showHotIcon: boolean }) {
  const [error, data] = await safeAwaitSSRData(
    Promise.all([
      getPaginatedBuilders({
        limit: 10,
        week: getCurrentWeek(),
        cursor: null
      }),
      getBuildersWeeklyGemsAverage()
    ])
  );

  if (error) {
    return null;
  }

  const [{ builders, nextCursor }, { averageGems }] = data;

  return (
    <BuildersGalleryContainer
      dailyAverageGems={averageGems}
      initialCursor={nextCursor}
      initialBuilders={builders}
      showHotIcon={showHotIcon}
    />
  );
}
