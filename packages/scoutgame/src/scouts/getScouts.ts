import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export type ScoutsSortBy = 'cards' | 'points' | 'builders' | 'rank';

export type ScoutInfo = {
  path: string;
  avatar: string;
  displayName: string;
  rank: number;
  points: number;
  cards: number;
  builders: number;
};

export async function getScouts({
  limit = 200,
  sortBy = 'rank',
  order = 'asc',
  season = getCurrentSeasonStart()
}: {
  limit?: number;
  sortBy?: ScoutsSortBy;
  order?: 'asc' | 'desc';
  season?: string;
}) {
  // First get all users sorted by points to establish ranks
  const allUsers = await prisma.userSeasonStats.findMany({
    where: {
      pointsEarnedAsScout: {
        gt: 0
      },
      season,
      user: {
        deletedAt: null
      }
    },
    orderBy: {
      pointsEarnedAsScout: 'desc'
    },
    select: {
      userId: true
    }
  });

  // Create a map of user path to their rank
  const rankMap = new Map(allUsers.map((user, index) => [user.userId, index + 1]));

  if (sortBy === 'points' || sortBy === 'rank') {
    const scouts = await prisma.userSeasonStats.findMany({
      where: {
        nftsPurchased: {
          not: 0
        },
        season,
        user: {
          deletedAt: null
        }
      },
      take: limit,
      orderBy: [
        {
          pointsEarnedAsScout: 'desc'
        },
        {
          nftsPurchased: 'desc'
        }
      ],
      select: {
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            wallets: {
              select: {
                scoutedNfts: {
                  select: {
                    builderNft: {
                      select: {
                        builderId: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        nftsPurchased: true,
        pointsEarnedAsScout: true
      }
    });

    return scouts
      .map((scout) => ({
        path: scout.user.path,
        avatar: scout.user.avatar as string,
        displayName: scout.user.displayName,
        rank: rankMap.get(scout.user.id) || 0,
        points: scout.pointsEarnedAsScout || 0,
        cards: scout.nftsPurchased || 0,
        builders: new Set(
          scout.user.wallets.flatMap((wallet) => wallet.scoutedNfts.map((nft) => nft.builderNft.builderId))
        ).size
      }))
      .sort((a, b) => {
        if (sortBy === 'points') {
          return order === 'asc' ? a.points - b.points : b.points - a.points;
        } else {
          return order === 'asc' ? a.rank - b.rank : b.rank - a.rank;
        }
      });
  } else if (sortBy === 'cards' || sortBy === 'builders') {
    const builders = await prisma.userSeasonStats.findMany({
      where: {
        season,
        nftsPurchased: {
          not: 0
        },
        user: {
          deletedAt: null
        }
      },
      orderBy: {
        nftsPurchased: order
      },
      take: limit,
      select: {
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            wallets: {
              select: {
                purchaseEvents: {
                  distinct: ['builderNftId'],
                  where: {
                    builderEvent: {
                      season
                    }
                  },
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        },
        pointsEarnedAsScout: true,
        nftsPurchased: true
      }
    });

    const sortedBuilders = builders.map((builder) => ({
      path: builder.user.path,
      avatar: builder.user.avatar as string,
      displayName: builder.user.displayName,
      rank: rankMap.get(builder.user.id) || 0,
      points: builder.pointsEarnedAsScout || 0,
      cards: builder.nftsPurchased || 0,
      builders: builder.user.wallets.flatMap((wallet) => wallet.purchaseEvents).length
    }));

    if (sortBy === 'cards') {
      return sortedBuilders;
    } else if (sortBy === 'builders') {
      return sortedBuilders.sort((a, b) => {
        if (order === 'asc') {
          return a.builders - b.builders;
        } else {
          return b.builders - a.builders;
        }
      });
    }
  }

  log.error(`Invalid sortBy provided for getScouts: ${sortBy}`);
  return [];
}
