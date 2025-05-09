import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

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

export async function getMatchupLeaderboard(week: string, limit?: number): Promise<ScoutMatchupEntry[]> {
  const entries = await prisma.scoutMatchup.findMany({
    where: {
      week,
      submittedAt: {
        not: null
      },
      OR: [
        {
          registrationTx: { status: 'success' }
        },
        {
          freeRegistration: true
        }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      scout: {
        select: {
          id: true,
          displayName: true,
          avatar: true,
          path: true,
          wallets: {
            select: {
              scoutedNfts: {
                select: {
                  builderNftId: true,
                  balance: true
                },
                where: {
                  builderNft: {
                    season: getCurrentSeasonStart(week)
                  }
                }
              }
            }
          }
        }
      },
      selections: {
        select: {
          developerNft: {
            select: {
              id: true,
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
    .map((entry) => {
      const developers = entry.selections
        // filter out selections if the scout no longer holds the NFT
        .filter((selection) =>
          entry.scout.wallets.some((w) =>
            w.scoutedNfts.some((nft) => nft.balance > 0 && nft.builderNftId === selection.developerNft.id)
          )
        )
        .map((selection) => ({
          id: selection.developerNft!.builder.id,
          displayName: selection.developerNft!.builder.displayName,
          avatar: selection.developerNft!.builder.avatar || '',
          path: selection.developerNft!.builder.path,
          gemsCollected: selection.developerNft!.builder.userWeeklyStats.reduce(
            (acc, stat) => acc + stat.gemsCollected,
            0
          )
        }))
        .sort((a, b) => b.gemsCollected - a.gemsCollected);
      const totalGemsCollected = developers.reduce((acc, selection) => acc + selection.gemsCollected, 0);
      return {
        createdAt: entry.createdAt,
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
    .sort((a, b) => {
      if (b.totalGemsCollected !== a.totalGemsCollected) {
        return b.totalGemsCollected - a.totalGemsCollected;
      }
      // If gems collected are equal, sort by earliest createdAt
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  return leaderboard
    .map((entry, i) => ({
      ...entry,
      rank: i + 1 // rankMap.get(entry.totalGemsCollected)!
    }))
    .slice(0, limit);
}
