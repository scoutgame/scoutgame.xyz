import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason } from '@packages/dates/utils';

import type { ProjectAchievement } from './getNewProjectAchievements';

export async function saveProjectAchievement(achievement: ProjectAchievement, week: string) {
  const { projectId, tier, builders } = achievement;
  const season = getCurrentSeason(week).start;

  await prisma.$transaction(async (tx) => {
    const record = await tx.scoutProjectOnchainAchievement.create({
      data: {
        projectId,
        tier,
        week
      }
    });
    for (const builder of builders) {
      await tx.builderEvent.create({
        data: {
          builderId: builder.builderId,
          type: 'onchain_achievement',
          onchainAchievementId: record.id,
          week,
          season,
          gemsReceipt: {
            create: {
              value: builder.gems,
              type: 'onchain_achievement'
            }
          }
        }
      });
    }
  });
}
