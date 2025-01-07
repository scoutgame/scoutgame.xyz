import 'server-only';

import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { MAX_STARTER_PACK_PURCHASES } from '@packages/scoutgame/builderNfts/constants';
import type { StarterPackBuilder } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { getStarterPackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { getTodaysHotBuilders } from '@packages/scoutgame/builders/getTodaysHotBuilders';
import { aggregateTokensPurchased } from '@packages/scoutgame/scouts/aggregateTokensPurchased';

import { ScoutPageCarousel } from './ScoutPageCarousel';

export async function ScoutPageCarouselContainer() {
  const session = await getSession();
  const scoutId = session.scoutId;
  const [, builders = []] = await safeAwaitSSRData(getTodaysHotBuilders());
  const starterPackBuilders: StarterPackBuilder[] = [];

  const [, purchases = 0] = await safeAwaitSSRData(aggregateTokensPurchased(scoutId));

  const remainingStarterCards = MAX_STARTER_PACK_PURCHASES - purchases;

  if (remainingStarterCards > 0) {
    const [, remainingStarterPackBuilders = []] = scoutId
      ? await safeAwaitSSRData(getStarterPackBuilders({ userId: scoutId }))
      : [null, []];

    if (remainingStarterPackBuilders.length > 0) {
      starterPackBuilders.push(...remainingStarterPackBuilders);
    }
  }

  return (
    <ScoutPageCarousel
      builders={builders}
      starterPackBuilders={starterPackBuilders}
      remainingStarterCards={remainingStarterCards}
      scoutId={scoutId}
    />
  );
}
