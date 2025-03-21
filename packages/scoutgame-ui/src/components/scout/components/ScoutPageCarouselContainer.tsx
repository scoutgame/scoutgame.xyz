import 'server-only';

import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getStarterPackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { getTodaysHotBuilders } from '@packages/scoutgame/builders/getTodaysHotBuilders';
import { countStarterPackTokensPurchased } from '@packages/scoutgame/scouts/countStarterPackTokensPurchased';

import { ScoutPageCarousel } from './ScoutPageCarousel';

export async function ScoutPageCarouselContainer({ nftType }: { nftType: 'default' | 'starter' }) {
  const session = await getSession();
  const scoutId = session.scoutId;
  const [, builders = []] = await safeAwaitSSRData(getTodaysHotBuilders());

  const [, purchasedCards] = await safeAwaitSSRData(countStarterPackTokensPurchased(scoutId));

  const [, starterCardBuilders = []] = scoutId
    ? await safeAwaitSSRData(getStarterPackBuilders({ userId: scoutId }))
    : [null, []];

  return <ScoutPageCarousel nftType={nftType} builders={builders} starterCardDevs={starterCardBuilders} />;
}
