import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';

import { getDevelopersLeaderboard } from './getDevelopersLeaderboard';

export async function updateBuildersRank({ week = getCurrentWeek(), season }: { week?: string; season?: string } = {}) {
  const buildersLeaderboard = await getDevelopersLeaderboard({ week, season });

  for (const { builder, rank } of buildersLeaderboard) {
    await prisma.userWeeklyStats.update({
      where: {
        userId_week: {
          userId: builder.id,
          week
        }
      },
      data: {
        rank
      }
    });
  }
  return buildersLeaderboard;
}
