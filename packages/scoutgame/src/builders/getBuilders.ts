import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type BuildersSortBy = 'price' | 'level' | 'week_gems' | 'estimated_payout';

export type BuilderMetadata = {
  path: string;
  avatar: string;
  displayName: string;
  price: bigint;
  level: number | null;
  weekGems: number;
  estimatedPayout: number | null;
  last14Days: (number | null)[];
  nftsPurchasedByUser: number | null;
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
                currentPrice: true,
                nftSoldEvents: userId
                  ? {
                      where: {
                        builderEvent: {
                          season
                        },
                        scoutId: userId
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
            events: {
              where: {
                type: {
                  in: ['daily_commit', 'merged_pull_request']
                },
                week,
                gemsReceipt: {
                  isNot: null
                }
              },
              select: {
                gemsReceipt: {
                  select: {
                    value: true
                  }
                }
              }
            }
          }
        },
        level: true
      }
    });

    return usersSeasonStats
      .map(({ user }) => ({
        path: user.path,
        avatar: user.avatar as string,
        displayName: user.displayName,
        price: user.builderNfts[0]?.currentPrice,
        level: user.userSeasonStats[0]?.level || null,
        last14Days: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
        weekGems: user.events.reduce((acc, event) => acc + (event.gemsReceipt?.value || 0), 0),
        estimatedPayout: user.builderNfts[0]?.estimatedPayout || null,
        last14DaysRank: normalizeLast14DaysRank(user.builderCardActivities[0]) || [],
        nftsPurchasedByUser:
          user.builderNfts[0]?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
      }))
      .sort((a, b) => {
        if (a.level === null) {
          return 1;
        }
        if (b.level === null) {
          return -1;
        }

        if (order === 'asc') {
          return (a.level || 0) - (b.level || 0);
        } else {
          return (b.level || 0) - (a.level || 0);
        }
      });
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
        currentPrice: true,
        estimatedPayout: true,
        nftSoldEvents: userId
          ? {
              where: {
                builderEvent: {
                  season
                },
                scoutId: userId
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
                rank: true
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
            events: {
              where: {
                type: {
                  in: ['daily_commit', 'merged_pull_request']
                },
                week,
                gemsReceipt: {
                  isNot: null
                }
              },
              select: {
                gemsReceipt: {
                  select: {
                    value: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return builderNfts
      .map(({ builder, nftSoldEvents, currentPrice, estimatedPayout }) => ({
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        rank: builder.userWeeklyStats[0]?.rank || -1,
        price: currentPrice,
        estimatedPayout: estimatedPayout || null,
        weekGems: builder.events.reduce((acc, event) => acc + (event.gemsReceipt?.value || 0), 0),
        last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || null,
        nftsPurchasedByUser: nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
      }))
      .sort((a, b) => {
        if (a.estimatedPayout === null) {
          return 1;
        }
        if (b.estimatedPayout === null) {
          return -1;
        }

        if (order === 'asc') {
          return (a.estimatedPayout || 0) - (b.estimatedPayout || 0);
        } else {
          return (b.estimatedPayout || 0) - (a.estimatedPayout || 0);
        }
      });
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
                scoutId: userId
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
            events: {
              where: {
                type: {
                  in: ['daily_commit', 'merged_pull_request']
                },
                week,
                gemsReceipt: {
                  isNot: null
                }
              },
              select: {
                gemsReceipt: {
                  select: {
                    value: true
                  }
                }
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
      price: currentPrice,
      weekGems: builder.events.reduce((acc, event) => acc + (event.gemsReceipt?.value || 0), 0),
      last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
      level: builder.userSeasonStats[0]?.level || null,
      estimatedPayout: estimatedPayout || null,
      nftsPurchasedByUser: nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null
    }));
  } else if (sortBy === 'week_gems') {
    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        type: {
          in: ['daily_commit', 'merged_pull_request']
        },
        season,
        week,
        builder: {
          builderStatus: 'approved',
          deletedAt: null
        },
        gemsReceipt: {
          isNot: null
        }
      },
      select: {
        builder: {
          select: {
            id: true
          }
        },
        gemsReceipt: {
          select: {
            value: true
          }
        }
      }
    });

    const builders = await prisma.scout.findMany({
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
                    scoutId: userId
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
    });

    const buildersWeekGemsRecord: Record<string, number> = {};

    builderEvents.forEach((builderEvent) => {
      buildersWeekGemsRecord[builderEvent.builder.id] =
        (buildersWeekGemsRecord[builderEvent.builder.id] || 0) + (builderEvent.gemsReceipt?.value || 0);
    });

    return builders
      .map((builder) => ({
        path: builder.path,
        avatar: builder.avatar as string,
        displayName: builder.displayName,
        weekGems: buildersWeekGemsRecord[builder.id] || 0,
        last14Days: normalizeLast14DaysRank(builder.builderCardActivities[0]) || [],
        level: builder.userSeasonStats[0]?.level || null,
        estimatedPayout: builder.builderNfts[0]?.estimatedPayout || null,
        nftsPurchasedByUser:
          builder.builderNfts[0]?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || null,
        price: builder.builderNfts[0]?.currentPrice || 0n
      }))
      .sort((a, b) => {
        if (order === 'asc') {
          return a.weekGems - b.weekGems;
        } else {
          return b.weekGems - a.weekGems;
        }
      })
      .slice(0, limit);
  }

  log.error(`Invalid sortBy provided: ${sortBy}`);

  return [];
}
