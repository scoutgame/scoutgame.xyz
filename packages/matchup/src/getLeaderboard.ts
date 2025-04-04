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

export async function getLeaderboard(week: string, limit?: number): Promise<ScoutMatchupEntry[]> {
  const entries = await prisma.scoutMatchup.findMany({
    where: {
      week,
      submittedAt: {
        not: null
      }
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
          developerNft: {
            select: {
              builder: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true,
                  path: true,
                  userWeeklyStats: {
                    where: {
                      week
                    },
                    select: {
                      gemsCollected: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  const leaderboard = entries
    .map((entry, index) => {
      const developers = entry.selections
        .map((selection) => ({
          id: selection.developerNft.builder.id,
          displayName: selection.developerNft.builder.displayName,
          avatar: selection.developerNft.builder.avatar || '',
          path: selection.developerNft.builder.path,
          gemsCollected: selection.developerNft.builder.userWeeklyStats.reduce(
            (acc, stat) => acc + stat.gemsCollected,
            0
          )
        }))
        .sort((a, b) => b.gemsCollected - a.gemsCollected);
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
  return leaderboard.slice(0, limit);
}
