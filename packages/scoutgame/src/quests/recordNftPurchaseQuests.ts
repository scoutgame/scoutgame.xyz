import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { completeQuests } from './completeQuests';
import type { QuestType } from './questRecords';

export async function recordNftPurchaseQuests(scoutId: string, skipMixpanel: boolean = false) {
  const season = getCurrentSeasonStart();
  const scoutNftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutWallet: {
        scoutId
      },
      builderNft: {
        season
      }
    },
    select: {
      builderNftId: true,
      builderNft: {
        select: {
          nftType: true
        }
      },
      tokensPurchased: true
    }
  });

  const starterPackCardPurchases = scoutNftPurchaseEvents.filter(
    (event) => event.builderNft.nftType === 'starter_pack'
  );
  const fullSeasonCardPurchases = scoutNftPurchaseEvents.filter((event) => event.builderNft.nftType === 'default');

  const totalStarterPackCardsPurchased = starterPackCardPurchases.reduce((acc, event) => {
    return acc + event.tokensPurchased;
  }, 0);
  const totalFullSeasonCardsPurchased = fullSeasonCardPurchases.reduce((acc, event) => {
    return acc + event.tokensPurchased;
  }, 0);
  const totalCardsPurchased = totalStarterPackCardsPurchased + totalFullSeasonCardsPurchased;
  const uniqueCardPurchases = new Set(fullSeasonCardPurchases.map((event) => event.builderNftId)).size;
  const questTypes: QuestType[] = [];

  // First starter pack card purchased
  if (totalStarterPackCardsPurchased >= 1) {
    questTypes.push('scout-starter-card');
  }

  // All 3 starter pack cards purchased
  if (totalStarterPackCardsPurchased >= 3) {
    questTypes.push('scout-3-starter-cards');
  }

  // First full season card purchased
  if (totalFullSeasonCardsPurchased >= 1) {
    questTypes.push('scout-full-season-card');
  }

  // 5 unique cards purchased
  if (uniqueCardPurchases >= 5) {
    questTypes.push('scout-5-builders');
  }

  if (questTypes.length) {
    await completeQuests(scoutId, questTypes, skipMixpanel);
  }
}
