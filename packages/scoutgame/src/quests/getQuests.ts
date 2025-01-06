import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../dates/utils';

import { questsRecord, type QuestInfo, type QuestType } from './questRecords';

export async function getQuests(userId: string): Promise<QuestInfo[]> {
  const season = getCurrentSeasonStart();
  const socialQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      userId
    },
    include: {
      event: {
        select: {
          season: true
        }
      }
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
      // if a quest is resettable, we only count it if it's from the current season
      completed: socialQuests.some(
        (q) => q.type === type && (questsRecord[type].resettable === false || q.event?.season === season)
      ),
      completedSteps
    };
  });
}
