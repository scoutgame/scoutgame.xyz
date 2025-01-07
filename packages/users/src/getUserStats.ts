import type { Scout, UserAllTimeStats, UserSeasonStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export type UserStats = {
  seasonPoints?: Pick<UserSeasonStats, 'pointsEarnedAsBuilder' | 'pointsEarnedAsScout'>;
  allTimePoints?: Pick<UserAllTimeStats, 'pointsEarnedAsBuilder' | 'pointsEarnedAsScout'>;
  currentBalance: Scout['currentBalance'];
};

export async function getUserStats(userId: string): Promise<UserStats> {
  const currentUser = await prisma.scout.findUnique({
    where: {
      id: userId
    },
    select: {
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          pointsEarnedAsBuilder: true,
          pointsEarnedAsScout: true
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true,
          pointsEarnedAsScout: true
        }
      },
      currentBalance: true
    }
  });

  const seasonPoints = currentUser?.userSeasonStats[0];
  const allTimePoints = currentUser?.userAllTimeStats[0];
  const currentBalance = currentUser?.currentBalance ?? 0;

  return {
    seasonPoints,
    allTimePoints,
    currentBalance
  };
}
