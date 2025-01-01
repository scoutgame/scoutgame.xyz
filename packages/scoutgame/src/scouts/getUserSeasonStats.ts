import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../dates/utils';

export async function getUserSeasonStats(userId: string) {
  return prisma.userSeasonStats.findUnique({
    where: {
      userId_season: {
        userId,
        season: getCurrentSeasonStart()
      }
    },
    select: {
      pointsEarnedAsScout: true
    }
  });
}
