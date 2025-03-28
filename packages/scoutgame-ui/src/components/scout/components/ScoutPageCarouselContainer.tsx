import 'server-only';

import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getStarterCardDevelopers } from '@packages/scoutgame/builders/getStarterCardDevelopers';
import { getTodaysHotBuilders } from '@packages/scoutgame/builders/getTodaysHotBuilders';

import { ScoutPageCarousel } from './ScoutPageCarousel/ScoutPageCarousel';

export async function ScoutPageCarouselContainer({ nftType }: { nftType: 'default' | 'starter' }) {
  const session = await getSession();
  const scoutId = session.scoutId;
  const [, builders = []] = await safeAwaitSSRData(getTodaysHotBuilders());

  const [, starterCardBuilders = []] = scoutId
    ? await safeAwaitSSRData(getStarterCardDevelopers({ userId: scoutId }))
    : [null, []];

  return <ScoutPageCarousel nftType={nftType} builders={builders} starterCardDevs={starterCardBuilders} />;
}
