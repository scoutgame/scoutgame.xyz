import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentWeek } from '../dates/utils';

import { getBuildersLeaderboard } from './getBuildersLeaderboard';

export async function updateBuildersRank({ week = getCurrentWeek(), season }: { week?: string; season?: string } = {}) {
  const buildersLeaderboard = await getBuildersLeaderboard({ week, season });

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

  log.info(`Updated ${buildersLeaderboard.length} builders rank for week ${week}`);
}
