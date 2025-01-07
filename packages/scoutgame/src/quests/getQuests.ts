import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { questsRecord, type QuestInfo, type QuestType } from './questRecords';

export async function getQuests(userId: string): Promise<QuestInfo[]> {
  const season = getCurrentSeasonStart();
  const socialQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      userId,
      season
    }
  });

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId: userId,
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
      }
    }
  });

  const starterPackCardPurchases = nftPurchaseEvents.filter((event) => event.builderNft.nftType === 'starter_pack');

  const uniqueCardPurchases = new Set(nftPurchaseEvents.map((event) => event.builderNftId)).size;

  return (Object.keys(questsRecord) as QuestType[]).map((type) => {
    let completedSteps: null | number = null;
    if (type === 'scout-3-starter-cards') {
      completedSteps = Math.min(starterPackCardPurchases.length, 3);
    } else if (type === 'scout-5-builders') {
      completedSteps = Math.min(uniqueCardPurchases, 5);
    }

    return {
      ...questsRecord[type],
      type,
      completed: socialQuests.some((q) => q.type === type),
      completedSteps
    };
  });
}
