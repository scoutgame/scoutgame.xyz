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

export type ScoutCursor = {
  id: number;
  sortType: ScoutsSortBy;
  order: 'asc' | 'desc';
};

export async function getPaginatedScouts({
  limit = 50,
  sortBy = 'rank',
  order = 'asc',
  season = getCurrentSeasonStart(),
  cursor
}: {
  limit?: number;
  sortBy?: ScoutsSortBy;
  order?: 'asc' | 'desc';
  season?: string;
  cursor?: ScoutCursor;
}): Promise<{ scouts: ScoutInfo[]; nextCursor: ScoutCursor | null }> {
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

  // Skip cursor processing if it doesn't match current sort type
  const activeCursor = cursor?.sortType === sortBy && cursor?.order === order ? cursor : undefined;

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
      skip: cursor ? 1 : 0,
      cursor: activeCursor
        ? {
            id: activeCursor.id
          }
        : undefined,
      orderBy: [
        {
          pointsEarnedAsScout: order
        },
        {
          nftsPurchased: order
        },
        {
          id: order
        }
      ],
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            wallets: {
              select: {
                scoutedNfts: {
                  where: {
                    builderNft: {
                      season: getCurrentSeasonStart()
                    }
                  },
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

    const scoutsData = scouts.map((scout) => ({
      path: scout.user.path,
      avatar: scout.user.avatar as string,
      displayName: scout.user.displayName,
      userId: scout.userId,
      rank: rankMap.get(scout.user.id) || 0,
      points: scout.pointsEarnedAsScout || 0,
      cards: scout.nftsPurchased || 0,
      builders: new Set(
        scout.user.wallets.flatMap((wallet) => wallet.scoutedNfts.map((nft) => nft.builderNft.builderId))
      ).size
    }));

    const sortedScouts = scoutsData.sort((a, b) => {
      if (sortBy === 'points') {
        return order === 'asc' ? a.points - b.points : b.points - a.points;
      } else {
        return order === 'asc' ? a.rank - b.rank : b.rank - a.rank;
      }
    });

    const nextId = scouts[scouts.length - 1]?.id;

    return {
      scouts: sortedScouts,
      nextCursor: scouts.length === limit ? { id: nextId, order, sortType: sortBy } : null
    };
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
      orderBy: [
        {
          nftsPurchased: order
        },
        {
          id: order
        }
      ],
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor.id
          }
        : undefined,
      take: limit,
      select: {
        id: true,
        userId: true,
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
      userId: builder.userId,
      rank: rankMap.get(builder.user.id) || 0,
      points: builder.pointsEarnedAsScout || 0,
      cards: builder.nftsPurchased || 0,
      builders: builder.user.wallets.flatMap((wallet) => wallet.purchaseEvents).length
    }));

    // Sort the data if needed
    const sortedResult =
      sortBy === 'builders'
        ? sortedBuilders.sort((a, b) => {
            if (order === 'asc') {
              return a.builders - b.builders;
            } else {
              return b.builders - a.builders;
            }
          })
        : sortedBuilders;

    const nextId = builders[builders.length - 1]?.id;

    return {
      scouts: sortedResult,
      nextCursor: builders.length === limit ? { id: nextId, order, sortType: sortBy } : null
    };
  }

  log.error(`Invalid sortBy provided for getScouts: ${sortBy}`);
  return { scouts: [], nextCursor: null };
}
