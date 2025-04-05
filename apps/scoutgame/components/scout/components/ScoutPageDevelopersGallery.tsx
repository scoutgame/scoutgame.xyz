import { getCurrentWeek } from '@packages/dates/utils';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getDevelopersForGallery } from '@packages/scoutgame/builders/getDevelopersForGallery';

import { DevelopersGalleryContainer } from './DevelopersGalleryContainer';

export async function ScoutPageDevelopersGallery({
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

  return <DevelopersGalleryContainer initialCursor={nextCursor} initialBuilders={developers} nftType={nftType} />;
}
