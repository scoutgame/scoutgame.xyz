import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { sendPointsForSocialQuest } from '../tokens/builderEvents/sendPointsForSocialQuest';

import type { QuestType } from './questRecords';
import { resettableQuestTypes, nonResettableQuestTypes, questsRecord } from './questRecords';

export async function completeQuests(
  userId: string,
  questTypes: QuestType[],
  skipMixpanel: boolean = false,
  season: string = getCurrentSeasonStart()
) {
  const week = getCurrentWeek();
  const completedQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      type: {
        in: questTypes
      },
      userId
    },
    select: {
      type: true,
      season: true
    }
  });

  const completedResettableQuestTypes: QuestType[] = [];
  const completedNonResettableQuestTypes: QuestType[] = [];

  completedQuests.forEach((quest) => {
    // Resettable quests are only completed if they are in the current season
    if (quest.season === season && resettableQuestTypes.includes(quest.type)) {
      completedResettableQuestTypes.push(quest.type as QuestType);
    } else if (nonResettableQuestTypes.includes(quest.type)) {
      completedNonResettableQuestTypes.push(quest.type as QuestType);
    }
  });

  const unfinishedQuests = questTypes.filter(
    (questType) =>
      !completedResettableQuestTypes.includes(questType) && !completedNonResettableQuestTypes.includes(questType)
  );

  for (const questType of unfinishedQuests) {
    await sendPointsForSocialQuest({
      builderId: userId,
      week,
      type: questType,
      season
    });
    if (!skipMixpanel) {
      trackUserAction('complete_quest', { userId, questType });
    }
  }
}
