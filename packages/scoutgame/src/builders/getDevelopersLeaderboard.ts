import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export type LeaderboardDeveloper = {
  developer: {
    id: string;
    path: string;
    displayName: string;
  };
  gemsCollected: number;
  rank: number;
};

export async function getDevelopersLeaderboard({
  quantity,
  week,
  season
}: {
  quantity?: number;
  week: string;
  season?: string;
}): Promise<LeaderboardDeveloper[]> {
  season ||= getCurrentSeasonStart(week);
  const userWeeklyStats = await prisma.userWeeklyStats.findMany({
    where: {
      week,
      user: {
        builderStatus: 'approved',
        deletedAt: null
      },
      gemsCollected: {
        gt: 0
      }
    },
    orderBy: {
      gemsCollected: 'desc'
    },
    select: {
      user: {
        select: {
          id: true,
          path: true,
          displayName: true,
          events: {
            where: {
              season,
              type: 'merged_pull_request'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            select: {
              createdAt: true
            }
          }
        }
      },
      gemsCollected: true
    }
  });

  // Sort based on gems collected first
  // If the gems are equal then order based on the earliest builder event created at date
  const topBuilders = userWeeklyStats
    .sort((a, b) => {
      if (a.gemsCollected === b.gemsCollected) {
        const userAEvent = a.user.events[0]?.createdAt.getTime() ?? 0;
        const userBEvent = b.user.events[0]?.createdAt.getTime() ?? 0;
        if (userBEvent === userAEvent) {
          return a.user.displayName.localeCompare(b.user.displayName);
        }

        return userAEvent - userBEvent;
      }
      return b.gemsCollected - a.gemsCollected;
    })
    .map((userWeeklyStat, index) => ({
      developer: {
        id: userWeeklyStat.user.id,
        path: userWeeklyStat.user.path,
        displayName: userWeeklyStat.user.displayName
      },
      gemsCollected: userWeeklyStat.gemsCollected,
      rank: index + 1
    })) as LeaderboardDeveloper[];

  if (quantity) {
    return topBuilders.slice(0, quantity);
  }

  return topBuilders;
}
