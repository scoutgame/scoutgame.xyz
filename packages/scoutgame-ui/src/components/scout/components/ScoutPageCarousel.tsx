import 'server-only';

import { Typography } from '@mui/material';
import { MAX_STARTER_PACK_PURCHASES } from '@packages/scoutgame/builderNfts/constants';
import { getStarterPackBuilders } from '@packages/scoutgame/builders/getStarterPackBuilders';
import { aggregateTokensPurchased } from '@packages/scoutgame/scouts/aggregateTokensPurchased';
import { getSession } from '@packages/scoutgame/session/getSession';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import { StarterPackCarousel } from '../StarterPackCarousel/StarterPackCarousel';
import { TodaysHotBuildersCarousel } from '../TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';

export async function ScoutPageCarousel() {
  const session = await getSession();
  const scoutId = session.scoutId;

  if (scoutId) {
    const [, purchases = 0] = await safeAwaitSSRData(aggregateTokensPurchased(scoutId));

    const remainingStarterCards = MAX_STARTER_PACK_PURCHASES - purchases;

    if (remainingStarterCards > 0) {
      const [, starterPackBuilders = []] = await safeAwaitSSRData(getStarterPackBuilders({ userId: scoutId }));

      if (starterPackBuilders.length > 0) {
        return <StarterPackCarousel builders={starterPackBuilders} remainingStarterCards={remainingStarterCards} />;
      }
    }
  }

  return (
    <>
      <Typography variant='h5' color='secondary' textAlign='center' fontWeight='bold' mb={2} mt={2}>
        Scout today's HOT Builders!
      </Typography>
      <TodaysHotBuildersCarousel showPromoCards />
    </>
  );
}
