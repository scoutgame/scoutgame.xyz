import { prisma } from '@charmverse/core/prisma-client';

import { completeQuests } from '../quests/completeQuests';
import type { QuestType } from '../quests/questRecords';

export async function recordNftPurchaseQuests(scoutId: string) {
  const scoutNftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId
    },
    select: {
      builderNftId: true,
      builderNft: {
        select: {
          nftType: true,
          builder: {
            select: {
              hasMoxieProfile: true
            }
          }
        }
      },
      tokensPurchased: true
    }
  });

  const hasMoxieProfile = scoutNftPurchaseEvents.some((event) => event.builderNft.builder.hasMoxieProfile);

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

  // This is a new scout and thus they have entered the OP New Scout Competition
  if (totalCardsPurchased >= 1) {
    questTypes.push('enter-op-new-scout-competition');
  }

  // If the scout purchased a card of a moxie builder, mark the moxie quest as complete
  if (hasMoxieProfile) {
    questTypes.push('scout-moxie-builder');
  }

  await completeQuests(scoutId, questTypes);
}
