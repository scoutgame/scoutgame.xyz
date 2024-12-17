import { getPaginatedBuilders } from '@packages/scoutgame/builders/getPaginatedBuilders';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export async function ScoutPageBuildersGallery({ showHotIcon }: { showHotIcon: boolean }) {
  const [error, data] = await safeAwaitSSRData(
    getPaginatedBuilders({
      limit: 10,
      week: getCurrentWeek(),
      season: currentSeason,
      cursor: null
    })
  );

  if (error) {
    return null;
  }

  const { builders, nextCursor } = data;

  return <BuildersGalleryContainer initialCursor={nextCursor} initialBuilders={builders} showHotIcon={showHotIcon} />;
}