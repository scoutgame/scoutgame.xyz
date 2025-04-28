import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type DevelopersSortBy = 'price' | 'level' | 'week_gems' | 'estimated_payout';

// Simple cursor type that works for all sort types
export type DeveloperTableCursor = {
  id: string | number;
  value: number; // value is needed for cursors where the id is not unique (e.g. createdAt)
  sortType: DevelopersSortBy;
  order?: 'asc' | 'desc';
};

export type DeveloperMetadata = Omit<BuilderInfo, 'nftType' | 'listings' | 'builderStatus'> & {
  rank: number | null;
};

export async function getDevelopersForTable({
  limit = 50,
  sortBy = 'week_gems',
  order = 'asc',
  loggedInScoutId,
  nftType: _nftType,
  cursor
}: {
  loggedInScoutId?: string;
  limit?: number;
  sortBy?: DevelopersSortBy;
  order?: 'asc' | 'desc';
  nftType: 'default' | 'starter';
  cursor?: DeveloperTableCursor;
}): Promise<{ developers: DeveloperMetadata[]; nextCursor: DeveloperTableCursor | null }> {
  const nftType = _nftType === 'default' ? BuilderNftType.default : BuilderNftType.starter_pack;
  const season = '2025-W02';
  const week = '2025-W16';

  // Skip cursor processing if it doesn't match current sort type
  const activeCursor = cursor?.sortType === sortBy && cursor?.order === order ? cursor : undefined;

  if (sortBy === 'level') {
    // For level sorting, we fetch from userSeasonStats
    const usersSeasonStats = await prisma.userSeasonStats.findMany({
      where: {
        user: {
          builderStatus: 'approved',
          deletedAt: null,
          builderNfts: {
            some: {
              season: '2025-W18'
            }
          }
        },
        season
      },
      orderBy: [
        {
          level: order
        },
        {
          pointsEarnedAsBuilder: order
        },
        {
          id: order
        }
      ],
      take: limit,
      skip: activeCursor ? 1 : 0,
      cursor: activeCursor
        ? {
            id: activeCursor.id as number
          }
        : undefined,
      select: {
        id: true,
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            builderNfts: {
              where: {
                season,
                nftType
              },
              select: {
                estimatedPayout: true,
                currentPriceDevToken: true,
                imageUrl: true,
                congratsImageUrl: true,
                nftOwners: loggedInScoutId
                  ? {
                      where: {
                        scoutWallet: {
                          scoutId: loggedInScoutId
                        }
                      },
                      select: {
                        balance: true
                      }
                    }
                  : undefined
              }
            },
            builderCardActivities: {
              select: {
                last14Days: true
              }
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                gemsCollected: true,
                rank: true
              }
            }
          }
        },
        level: true
      }
    });

    const developers: DeveloperMetadata[] = usersSeasonStats.map(({ user, level }) => ({
      id: user.id,
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      price: BigInt(user.builderNfts[0]?.currentPriceDevToken ?? 0),
      level,
      congratsImageUrl: user.builderNfts[0]?.congratsImageUrl,
      nftImageUrl: user.builderNfts[0]?.imageUrl,
      last14DaysRank: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      gemsCollected: user.userWeeklyStats[0]?.gemsCollected || 0,
      estimatedPayout: user.builderNfts[0]?.estimatedPayout || 0,
      rank: user.userWeeklyStats[0]?.rank,
      nftsSoldToLoggedInScout: user.builderNfts[0]?.nftOwners?.reduce((acc, nft) => acc + nft.balance, 0)
    }));

    const lastItem = usersSeasonStats[usersSeasonStats.length - 1];
    const nextCursor =
      lastItem && developers.length === limit
        ? { id: lastItem.id, value: lastItem.level, order, sortType: sortBy }
        : null;

    return { developers, nextCursor };
  } else if (sortBy === 'estimated_payout') {
    // For estimated_payout sorting, we fetch from builderNft
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season,
        nftType,
        builder: {
          builderStatus: 'approved',
          deletedAt: null,
          builderNfts: {
            some: {
              season: '2025-W18'
            }
          }
        }
      },
      orderBy: [
        {
          estimatedPayout: order
        },
        {
          createdAt: order
        }
      ],
      take: limit,
      skip: activeCursor ? 1 : 0,
      cursor: activeCursor
        ? {
            estimatedPayout_createdAt: {
              estimatedPayout: activeCursor.value,
              createdAt: new Date(activeCursor.id as string)
            }
          }
        : undefined,
      select: {
        createdAt: true,
        imageUrl: true,
        congratsImageUrl: true,
        builderId: true,
        currentPriceDevToken: true,
        estimatedPayout: true,
        nftOwners: loggedInScoutId
          ? {
              where: {
                scoutWallet: {
                  scoutId: loggedInScoutId
                }
              },
              select: {
                balance: true
              }
            }
          : undefined,
        builder: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                rank: true,
                gemsCollected: true
              }
            },
            userSeasonStats: {
              where: {
                season
              },
              select: {
                level: true
              }
            },
            builderCardActivities: {
              select: {
                last14Days: true
              }
            }
          }
        }
      }
    });

    const developers: DeveloperMetadata[] = builderNfts.map(
      ({ builder, nftOwners, currentPriceDevToken, estimatedPayout, imageUrl, congratsImageUrl }) => ({
        id: builder.id,
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        price: BigInt(currentPriceDevToken ?? 0),
        estimatedPayout: estimatedPayout || 0,
        gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
        last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || 0,
        rank: builder.userWeeklyStats[0]?.rank,
        congratsImageUrl,
        nftImageUrl: imageUrl,
        nftsSoldToLoggedInScout: nftOwners?.reduce((acc: number, nft: { balance: number }) => acc + nft.balance, 0)
      })
    );

    const lastItem = builderNfts[builderNfts.length - 1];
    const nextCursor =
      lastItem && developers.length === limit
        ? { id: lastItem.createdAt.toISOString(), value: lastItem.estimatedPayout || 0, order, sortType: sortBy }
        : null;

    return { developers, nextCursor };
  } else if (sortBy === 'price') {
    // For price sorting, we fetch from builderNft
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season: '2025-W18',
        nftType,
        builder: {
          builderStatus: 'approved',
          deletedAt: null
        }
      },
      orderBy: [
        {
          currentPrice: order
        },
        {
          createdAt: order
        }
      ],
      take: limit,
      skip: activeCursor ? 1 : 0,
      cursor: activeCursor
        ? {
            currentPrice_createdAt: {
              currentPrice: activeCursor.value,
              createdAt: new Date(activeCursor.id as string)
            }
          }
        : undefined,
      select: {
        createdAt: true,
        builderId: true,
        imageUrl: true,
        congratsImageUrl: true,
        estimatedPayout: true,
        nftOwners: loggedInScoutId
          ? {
              where: {
                scoutWallet: {
                  scoutId: loggedInScoutId
                }
              },
              select: {
                balance: true
              }
            }
          : undefined,
        builder: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            userSeasonStats: {
              where: {
                season
              },
              select: {
                level: true
              }
            },
            builderCardActivities: {
              select: {
                last14Days: true
              }
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                rank: true,
                gemsCollected: true
              }
            }
          }
        },
        currentPrice: true,
        currentPriceDevToken: true
      }
    });

    const developers = builderNfts.map(
      ({ builder, nftOwners, currentPriceDevToken, estimatedPayout, imageUrl, congratsImageUrl }) => ({
        id: builder.id,
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        price: BigInt(currentPriceDevToken ?? 0),
        gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
        last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || 0,
        rank: builder.userWeeklyStats[0]?.rank,
        estimatedPayout: estimatedPayout || 0,
        congratsImageUrl,
        nftImageUrl: imageUrl,
        nftsSoldToLoggedInScout: nftOwners?.reduce((acc: number, nft: { balance: number }) => acc + nft.balance, 0)
      })
    );

    const lastItem = builderNfts[builderNfts.length - 1];
    const nextCursor =
      lastItem && developers.length === limit
        ? {
            id: lastItem.createdAt.toISOString(),
            value: Number(lastItem.currentPrice),
            order,
            sortType: sortBy
          }
        : null;

    return { developers, nextCursor };
  } else if (sortBy === 'week_gems') {
    // For week_gems sorting, we fetch from userWeeklyStats
    const userWeeklyStats = await prisma.userWeeklyStats.findMany({
      where: {
        week,
        user: {
          builderStatus: 'approved',
          deletedAt: null,
          builderNfts: {
            some: {
              season: '2025-W18'
            }
          }
        }
      },
      orderBy: [
        {
          gemsCollected: order
        },
        {
          // rank is reverse
          rank: order === 'asc' ? 'desc' : 'asc'
        },
        {
          id: order
        }
      ],
      take: limit,
      skip: activeCursor ? 1 : 0,
      cursor: activeCursor
        ? {
            id: activeCursor.id as number
          }
        : undefined,
      select: {
        id: true,
        gemsCollected: true,
        rank: true,
        userId: true,
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            builderNfts: {
              where: {
                season,
                nftType
              },
              select: {
                currentPriceDevToken: true,
                estimatedPayout: true,
                imageUrl: true,
                congratsImageUrl: true,
                nftOwners: loggedInScoutId
                  ? {
                      where: {
                        scoutWallet: {
                          scoutId: loggedInScoutId
                        }
                      },
                      select: {
                        balance: true
                      }
                    }
                  : undefined
              }
            },
            builderCardActivities: {
              select: {
                last14Days: true
              }
            },
            userSeasonStats: {
              where: {
                season
              },
              select: {
                level: true
              }
            }
          }
        }
      }
    });

    const developers: DeveloperMetadata[] = userWeeklyStats.map(({ user, gemsCollected, rank }) => ({
      id: user.id,
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      gemsCollected: gemsCollected || 0,
      last14DaysRank: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      level: user.userSeasonStats[0]?.level || 0,
      estimatedPayout: user.builderNfts[0]?.estimatedPayout || 0,
      rank,
      congratsImageUrl: user.builderNfts[0]?.congratsImageUrl,
      nftImageUrl: user.builderNfts[0]?.imageUrl,
      nftsSoldToLoggedInScout: user.builderNfts[0]?.nftOwners?.reduce(
        (acc: number, nft: { balance: number }) => acc + nft.balance,
        0
      ),
      price: BigInt(user.builderNfts[0]?.currentPriceDevToken ?? 0)
    }));

    const lastItem = userWeeklyStats[userWeeklyStats.length - 1];
    const nextCursor =
      lastItem && developers.length === limit
        ? { id: lastItem.id, value: lastItem.gemsCollected, order, sortType: sortBy }
        : null;

    return { developers, nextCursor };
  }

  log.error(`Invalid sortBy provided for getDevelopersForTable: ${sortBy}`);

  return { developers: [], nextCursor: null };
}
