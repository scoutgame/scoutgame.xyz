import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { resettableQuestTypes, questsRecord, type QuestInfo, type QuestType } from './questRecords';

export async function getQuests(userId: string, season = getCurrentSeasonStart()): Promise<QuestInfo[]> {
  const socialQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      userId
    }
  });

  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutWallet: {
        scoutId: userId
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
      }
    }
  });

  const starterPackCardPurchases = nftPurchaseEvents.filter((event) => event.builderNft.nftType === 'starter_pack');
  const fullSeasonCardPurchases = nftPurchaseEvents.filter((event) => event.builderNft.nftType === 'default');

  const uniqueCardPurchases = new Set(fullSeasonCardPurchases.map((event) => event.builderNftId)).size;

  return (
    (Object.keys(questsRecord) as QuestType[])
      .map((type) => {
        let completedSteps: null | number = null;
        if (type === 'scout-3-starter-cards') {
          completedSteps = Math.min(starterPackCardPurchases.length, 3);
        } else if (type === 'scout-5-builders') {
          completedSteps = Math.min(uniqueCardPurchases, 5);
        }

        const isCompleted = socialQuests.some((q) => q.type === type);
        const isCompletedInCurrentSeason = socialQuests.some((q) => q.type === type && q.season === season);
        const isResettable = resettableQuestTypes.includes(type);

        return {
          ...questsRecord[type],
          type,
          completed: isResettable ? isCompletedInCurrentSeason : isCompleted,
          completedSteps
        };
      })
      // for now, hide unverifiable quests
      .filter((quest) => quest.verifiable || quest.completed)
  );
}
