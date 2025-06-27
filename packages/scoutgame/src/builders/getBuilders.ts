import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

import { devTokenDecimals } from '../protocol/constants';

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
  nftsSoldToLoggedInScout: number | null;
  // nftsSoldToScoutInView: number | null;
  rank: number | null;
};

export async function getBuilders({
  limit = 200,
  sortBy = 'week_gems',
  order = 'asc',
  loggedInScoutId,
  nftType: _nftType
}: {
  loggedInScoutId?: string;
  limit?: number;
  sortBy?: BuildersSortBy;
  order?: 'asc' | 'desc';
  nftType: 'default' | 'starter';
}): Promise<BuilderMetadata[]> {
  const nftType = _nftType === 'default' ? BuilderNftType.default : BuilderNftType.starter_pack;
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
        level: true,
        user: {
          select: {
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
                estimatedPayoutDevToken: true,
                currentPrice: true,
                currentPriceDevToken: true,
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
        }
      }
    });

    return usersSeasonStats.map(({ user, level }) => ({
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      price: BigInt(user.builderNfts[0].currentPriceDevToken ?? 0),
      level,
      last14Days: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      gemsCollected: user.userWeeklyStats[0]?.gemsCollected || 0,
      estimatedPayout: Number(
        BigInt(user.builderNfts[0]?.estimatedPayoutDevToken || 0) / BigInt(10 ** devTokenDecimals)
      ),
      last14DaysRank: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      rank: user.userWeeklyStats[0]?.rank,
      nftsSoldToLoggedInScout: user.builderNfts[0]?.nftOwners?.reduce((acc, nft) => acc + nft.balance, 0)
    }));
  } else if (sortBy === 'estimated_payout') {
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season,
        nftType,
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
        currentPrice: true,
        currentPriceDevToken: true,
        estimatedPayout: true,
        estimatedPayoutDevToken: true,
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

    return builderNfts.map(
      ({ builder, nftOwners, currentPrice, estimatedPayout, currentPriceDevToken, estimatedPayoutDevToken }) => ({
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        price: BigInt(currentPriceDevToken ?? 0),
        estimatedPayout: Number(BigInt(estimatedPayoutDevToken || 0) / BigInt(10 ** devTokenDecimals)),
        gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
        last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || 0,
        rank: builder.userWeeklyStats[0]?.rank,
        nftsSoldToLoggedInScout: nftOwners.reduce((acc, nft) => acc + nft.balance, 0) || null
      })
    );
  } else if (sortBy === 'price') {
    const builderNfts = await prisma.builderNft.findMany({
      where: {
        season,
        nftType,
        builder: {
          builderStatus: 'approved',
          deletedAt: null
        }
      },
      orderBy: [
        {
          currentListingPrice: order
        },
        {
          currentPrice: order
        }
      ],
      take: limit,
      select: {
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
        currentPriceDevToken: true,
        estimatedPayoutDevToken: true
      }
    });

    return builderNfts.map(
      ({ builder, nftOwners, currentPrice, estimatedPayout, currentPriceDevToken, estimatedPayoutDevToken }) => ({
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        price: BigInt(currentPriceDevToken ?? 0),
        gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
        last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || 0,
        rank: builder.userWeeklyStats[0]?.rank,
        estimatedPayout: Number(BigInt(estimatedPayoutDevToken || 0) / BigInt(10 ** devTokenDecimals)),
        nftsSoldToLoggedInScout: nftOwners.reduce((acc, nft) => acc + nft.balance, 0)
      })
    );
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
        rank: true,
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
                currentPrice: true,
                currentPriceDevToken: true,
                estimatedPayout: true,
                estimatedPayoutDevToken: true,
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

    return userWeeklyStats.map(({ user, gemsCollected, rank }) => ({
      path: user.path,
      avatar: user.avatar as string,
      displayName: user.displayName,
      gemsCollected: gemsCollected || 0,
      last14Days: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
      level: user.userSeasonStats[0]?.level || 0,
      estimatedPayout: Number(
        BigInt(user.builderNfts[0]?.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals)
      ),
      rank,
      nftsSoldToLoggedInScout: user.builderNfts[0]?.nftOwners?.reduce((acc, nft) => acc + nft.balance, 0) || null,
      price: BigInt(user.builderNfts[0].currentPriceDevToken ?? 0)
    }));
  }

  log.error(`Invalid sortBy provided for getBuilders: ${sortBy}`);

  return [];
}
