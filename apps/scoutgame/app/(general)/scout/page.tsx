import { getSession } from '@packages/nextjs/session/getSession';
import type { BuildersSortBy } from '@packages/scoutgame/builders/getBuilders';

import { ScoutPage } from 'components/scout/ScoutPage';

export default async function Scout({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const scoutSort = (searchParams.scoutSort as string) || 'points';
  const builderSort = (searchParams.builderSort as BuildersSortBy) || 'week_gems';
  const builderOrder = (searchParams.builderOrder as string) || 'desc';
  const scoutOrder = (searchParams.scoutOrder as string) || 'desc';
  const scoutTab = (searchParams.scoutTab as string) || 'scouts';
  const buildersLayout = (searchParams.buildersLayout as string) || 'table';
  const searchParamsResolved = await searchParams;
  const tab = (searchParamsResolved.tab as string) || 'builders';
  const session = await getSession();
  const userId = session?.scoutId;
  // If the scout has purchased a starter card, show the top builders carousel
  // Otherwise, show the starter card view unless logged out
  // const [, purchasedCards] = await safeAwaitSSRData(countStarterPackTokensPurchased(scoutId));
  // const hasPurchasedStarterCard= !!purchasedCards && purchasedCards > 0;
  const defaultNftType = 'default'; // scoutId ? (hasPurchasedStarterCard ? 'top_builders' : 'starter_pack') : 'starter_pack';
  const nftType = (searchParams.nftType as 'default' | 'starter') || defaultNftType;
  return (
    <ScoutPage
      scoutSort={scoutSort}
      builderSort={builderSort}
      scoutOrder={scoutOrder}
      builderOrder={builderOrder}
      scoutTab={scoutTab}
      buildersLayout={buildersLayout}
      tab={tab}
      nftType={nftType}
      userId={userId}
    />
  );
}
