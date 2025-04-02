import { prisma } from '@charmverse/core/prisma-client';

export type ScoutMatchupEntry = {
  scout: {
    id: string;
    displayName: string;
    avatar: string;
    path: string;
  };
  rank: number;
  totalGemsCollected: number;
  developers: {
    id: string;
    displayName: string;
    avatar: string;
    path: string;
    gemsCollected: number;
  }[];
};

export async function getLeaderboard(week: string): Promise<ScoutMatchupEntry[]> {
  const entries = await prisma.scoutMatchup.findMany({
    where: {
      week
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      scout: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
          path: true
        }
      },
      selections: {
        select: {
          developer: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
              path: true,
              userWeeklyStats: {
                select: {
                  week: true,
                  gemsCollected: true
                }
              }
            }
          }
        }
      }
    }
  });
  return entries
    .map((entry, index) => {
      const developers = entry.selections.map((selection) => ({
        id: selection.developer.id,
        displayName: selection.developer.displayName,
        avatar: selection.developer.avatar || '',
        path: selection.developer.path,
        gemsCollected: selection.developer.userWeeklyStats.reduce((acc, stat) => acc + stat.gemsCollected, 0)
      }));
      const totalGemsCollected = developers.reduce((acc, selection) => acc + selection.gemsCollected, 0);
      return {
        scout: {
          id: entry.scout.id,
          displayName: entry.scout.displayName,
          avatar: entry.scout.avatar || '',
          path: entry.scout.path
        },
        totalGemsCollected,
        rank: -1,
        developers
      };
    })
    .sort((a, b) => b.totalGemsCollected - a.totalGemsCollected)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}
