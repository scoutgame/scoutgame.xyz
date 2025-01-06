import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { getCurrentSeasonStart } from '../dates/utils';
import { sendPointsForSocialQuest } from '../points/builderEvents/sendPointsForSocialQuest';

import type { QuestType } from './questRecords';
import { questsRecord } from './questRecords';

export async function completeQuests(userId: string, questTypes: QuestType[], skipMixpanel: boolean = false) {
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
      type: questType,
      season
    });
    if (!skipMixpanel) {
      trackUserAction('complete_quest', { userId, questType });
    }
  }
}
