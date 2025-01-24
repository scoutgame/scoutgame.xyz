import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPaginatedBuilders } from '@packages/scoutgame/builders/getPaginatedBuilders';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export async function ScoutPageBuildersGallery({ userId }: { userId?: string }) {
  const [error, data] = await safeAwaitSSRData(
    getPaginatedBuilders({
      limit: 10,
      week: getCurrentWeek(),
      cursor: null,
      scoutId: userId
    })
  );

  if (error) {
    return null;
  }

  const { builders, nextCursor } = data;

  return <BuildersGalleryContainer initialCursor={nextCursor} initialBuilders={builders} />;
}
