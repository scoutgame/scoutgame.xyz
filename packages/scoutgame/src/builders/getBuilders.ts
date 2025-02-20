import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type BuildersSortBy = 'price' | 'level' | 'week_gems' | 'estimated_payout';

export type BuilderMetadata = {
  path: string;
  avatar: string;
  displayName: string;
  price: bigint;
  level: number | null;
  gemsCollected: number;
  estimatedPayout: number | null;
  last14Days: (number | null)[];
  nftsSoldToScout: number | null;
};

export async function getBuilders({
  limit = 200,
  sortBy = 'week_gems',
  order = 'asc',
  userId
}: {
  userId?: string;
  limit?: number;
  sortBy?: BuildersSortBy;
  order?: 'asc' | 'desc';
}): Promise<BuilderMetadata[]> {
  const week = getCurrentWeek();

  const season = getCurrentSeasonStart(week);

  if (sortBy === 'level') {
    const usersSeasonStats = await prisma.userSeasonStats.findMany({
      where: {
        user: {
          builderStatus: 'approved',
          deletedAt: null,
          builderNfts: {
            some: {
              season
            }
          }
        },
        season
      },
      orderBy: {
        level: order
      },
      take: limit,
      select: {
        user: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            builderNfts: {
              where: {
                season,
                nftType: BuilderNftType.default
              },
              select: {
                estimatedPayout: true,
                // TODO: use the currentPriceInScoutToken when we move to $SCOUT
                currentPrice: true,
                nftSoldEvents: userId
                  ? {
                      where: {
                        builderEvent: {
                          season
                        },
                        scoutWallet: {
                          scoutId: userId
                        },
                        senderWalletAddress: null
                      },
                      select: {
                        tokensPurchased: true
                      }
                    }
                  : undefined
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
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                gemsCollected: true
              }
            }
          }
        },
        level: true
      }
    });

    return usersSeasonStats.map(({ user }) => ({
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      price: user.builderNfts[0]?.currentPrice,
      level: user.userSeasonStats[0]?.level || 0,
      last14Days: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      gemsCollected: user.userWeeklyStats[0]?.gemsCollected || 0,
      estimatedPayout: user.builderNfts[0]?.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      nftsSoldToScout:
        user.builderNfts[0]?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
    }));
  } else if (sortBy === 'estimated_payout') {
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season,
        nftType: BuilderNftType.default,
        builder: {
          builderStatus: 'approved',
          deletedAt: null,
          builderNfts: {
            some: {
              season
            }
          }
        }
      },
      orderBy: {
        estimatedPayout: order
      },
      take: limit,
      select: {
        // TODO: use the currentPriceInScoutToken when we move to $SCOUT
        currentPrice: true,
        estimatedPayout: true,
        nftSoldEvents: userId
          ? {
              where: {
                builderEvent: {
                  season
                },
                scoutWallet: {
                  scoutId: userId
                },
                senderWalletAddress: null
              },
              select: {
                tokensPurchased: true
              }
            }
          : undefined,
        builder: {
          select: {
            path: true,
            avatar: true,
            displayName: true,
            userWeeklyStats: {
              where: {
                week
              },
              select: {
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

    return builderNfts.map(({ builder, nftSoldEvents, currentPrice, estimatedPayout }) => ({
      path: builder.path,
      avatar: builder.avatar as string,
      displayName: builder.displayName,
      // TODO: use the currentPriceInScoutToken when we move to $SCOUT
      price: currentPrice,
      estimatedPayout: estimatedPayout || 0,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
      last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
      level: builder.userSeasonStats[0]?.level || 0,
      nftsSoldToScout: nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
    }));
  } else if (sortBy === 'price') {
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season,
        nftType: BuilderNftType.default,
        builder: {
          builderStatus: 'approved',
          deletedAt: null
        }
      },
      orderBy: {
        currentPrice: order
      },
      take: limit,
      select: {
        estimatedPayout: true,
        nftSoldEvents: userId
          ? {
              where: {
                builderEvent: {
                  season
                },
                scoutWallet: {
                  scoutId: userId
                },
                senderWalletAddress: null
              },
              select: {
                tokensPurchased: true
              }
            }
          : undefined,
        builder: {
          select: {
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
                gemsCollected: true
              }
            }
          }
        },
        currentPrice: true
      }
    });

    return builderNfts.map(({ builder, nftSoldEvents, currentPrice, estimatedPayout }) => ({
      path: builder.path,
      avatar: builder.avatar as string,
      displayName: builder.displayName,
      // TODO: use the currentPriceInScoutToken when we move to $SCOUT
      price: currentPrice,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
      last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: estimatedPayout || 0,
      nftsSoldToScout: nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
    }));
  } else if (sortBy === 'week_gems') {
    const userWeeklyStats = await prisma.userWeeklyStats.findMany({
      where: {
        week,
        season,
        user: {
          builderStatus: 'approved',
          deletedAt: null
        }
      },
      orderBy: {
        gemsCollected: order
      },
      take: limit,
      select: {
        gemsCollected: true,
        user: {
          select: {
            id: true,
            path: true,
            avatar: true,
            displayName: true,
            builderNfts: {
              where: {
                season,
                nftType: BuilderNftType.default
              },
              select: {
                currentPrice: true,
                estimatedPayout: true,
                nftSoldEvents: userId
                  ? {
                      where: {
                        builderEvent: {
                          season
                        },
                        scoutWallet: {
                          scoutId: userId
                        },
                        senderWalletAddress: null
                      },
                      select: {
                        tokensPurchased: true
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

    return userWeeklyStats.map(({ user, gemsCollected }) => ({
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      gemsCollected: gemsCollected || 0,
      last14Days: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      level: user.userSeasonStats[0]?.level || 0,
      estimatedPayout: user.builderNfts[0]?.estimatedPayout || 0,
      nftsSoldToScout:
        user.builderNfts[0]?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null,
      price: (user.builderNfts[0]?.currentPrice || 0) as bigint
    }));
  }

  log.error(`Invalid sortBy provided for getBuilders: ${sortBy}`);

  return [];
}
