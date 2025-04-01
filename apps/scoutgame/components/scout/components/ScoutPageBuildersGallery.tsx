import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDevelopersForGallery } from '@packages/scoutgame/builders/getDevelopersForGallery';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export async function ScoutPageBuildersGallery({
  userId,
  nftType
}: {
  userId?: string;
  nftType: 'default' | 'starter';
}) {
  const [error, data] = await safeAwaitSSRData(
    getDevelopersForGallery({
      week: getCurrentWeek(),
      nftType,
      scoutId: userId
    })
  );

  if (error) {
    return null;
  }

  const { developers, nextCursor } = data;

  return <BuildersGalleryContainer initialCursor={nextCursor} initialBuilders={developers} nftType={nftType} />;
}
