import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { sendPointsForSocialQuest } from '../points/builderEvents/sendPointsForSocialQuest';

import type { QuestType } from './questRecords';
import { questsRecord } from './questRecords';

export async function completeQuests(userId: string, questTypes: QuestType[], skipMixpanel: boolean = false) {
  const week = getCurrentWeek();
  const season = getCurrentSeasonStart();
  const completedQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      type: {
        in: questTypes
      },
      userId,
      season
    }
  });

  const completedQuestTypes = completedQuests.map((quest) => quest.type);

  const unfinishedQuests = questTypes.filter((questType) => !completedQuestTypes.includes(questType));

  for (const questType of unfinishedQuests) {
    const points = questsRecord[questType].points;
    await sendPointsForSocialQuest({
      builderId: userId,
      points,
      week,
      type: questType
    });
    if (!skipMixpanel) {
      trackUserAction('complete_quest', { userId, questType });
    }
  }
}
