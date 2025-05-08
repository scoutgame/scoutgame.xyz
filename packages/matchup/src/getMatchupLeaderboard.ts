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
      createdAt: 'desc'
    },
    select: {
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
    .sort((a, b) => b.totalGemsCollected - a.totalGemsCollected);

  // two players can have the same rank if they have the same points
  const rankings = Array.from(new Set(leaderboard.map((e) => e.totalGemsCollected))).sort((a, b) => b - a);
  const rankMap = new Map(rankings.map((rank, index) => [rank, index + 1]));
  return leaderboard
    .map((entry) => ({
      ...entry,
      rank: rankMap.get(entry.totalGemsCollected)!
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);
}
