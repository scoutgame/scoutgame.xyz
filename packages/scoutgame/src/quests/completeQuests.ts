import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { sendPointsForSocialQuest } from '../points/builderEvents/sendPointsForSocialQuest';

import type { QuestType } from './questRecords';
import { questsRecord } from './questRecords';

export async function completeQuests(userId: string, questTypes: QuestType[]) {
  const completedQuests = await prisma.scoutSocialQuest.findMany({
    where: {
      type: {
        in: questTypes
      },
      userId
    }
  });

  const completedQuestTypes = completedQuests.map((quest) => quest.type);

  const unfinishedQuests = questTypes.filter((questType) => !completedQuestTypes.includes(questType));

  for (const questType of unfinishedQuests) {
    const points = questsRecord[questType].points;
    await sendPointsForSocialQuest({
      builderId: userId,
      points,
      type: questType
    });
    trackUserAction('complete_quest', { userId, questType });
  }
}
