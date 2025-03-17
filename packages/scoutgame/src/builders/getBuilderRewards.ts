import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';

export type BuilderReward = {
  path: string;
  displayName: string;
  avatar: string | null;
  points: number;
  rank: number | null;
  cardsHeld: number;
};

export async function getSeasonBuilderRewards({
  userId,
  season = getCurrentSeasonStart()
}: {
  userId: string;
  season?: string;
}): Promise<BuilderReward[]> {
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          purchaseEvents: {
            where: {
              builderNft: {
                season
              }
            },
            select: {
              createdAt: true,
              builderNft: {
                select: {
                  builderId: true
                }
              },
              tokensPurchased: true
            }
          }
        }
      },
      pointsReceived: {
        where: {
          event: {
            season,
            type: 'gems_payout'
          }
        },
        select: {
          createdAt: true,
          value: true,
          event: {
            select: {
              builder: {
                select: {
                  id: true,
                  path: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  const builderRewardsRecord: Record<string, BuilderReward> = {};

  scout.pointsReceived.forEach((receipt) => {
    const builder = receipt.event.builder;
    const builderId = builder.id;
    const cardsHeld = scout.wallets
      .flatMap((wallet) => wallet.purchaseEvents)
      .filter((event) => event.createdAt < receipt.createdAt && event.builderNft.builderId === builderId)
      .reduce((acc, event) => acc + event.tokensPurchased, 0);
    if (cardsHeld) {
      if (!builderRewardsRecord[builderId]) {
        builderRewardsRecord[builderId] = {
          path: builder.path,
          displayName: builder.displayName,
          avatar: builder.avatar,
          cardsHeld,
          points: 0,
          rank: null
        };
      }
      builderRewardsRecord[builderId].points += receipt.value;
    }
  });

  return Object.values(builderRewardsRecord).sort((a, b) => b.points - a.points);
}

export async function getWeeklyBuilderRewards({
  userId,
  week
}: {
  userId: string;
  week: string;
}): Promise<BuilderReward[]> {
  const season = getCurrentSeasonStart(week);
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: {
        include: {
          purchaseEvents: {
            where: {
              builderEvent: {
                week: {
                  lte: week
                }
              },
              builderNft: {
                season
              }
            },
            select: {
              builderNft: {
                select: {
                  builderId: true
                }
              },
              tokensPurchased: true
            }
          }
        }
      },
      pointsReceived: {
        where: {
          event: {
            week,
            type: 'gems_payout'
          }
        },
        select: {
          value: true,
          event: {
            select: {
              builder: {
                select: {
                  id: true,
                  path: true,
                  displayName: true,
                  avatar: true,
                  userWeeklyStats: {
                    where: {
                      week
                    },
                    select: {
                      rank: true
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

  const builderTokensRecord: Record<string, number> = {};

  scout.wallets
    .flatMap((wallet) => wallet.purchaseEvents)
    .forEach((event) => {
      const builderId = event.builderNft.builderId;
      builderTokensRecord[builderId] = (builderTokensRecord[builderId] || 0) + event.tokensPurchased;
    });

  return scout.pointsReceived
    .map((receipt) => {
      const builder = receipt.event.builder;
      const cardsHeld = builderTokensRecord[builder.id];
      const rank = builder.userWeeklyStats[0]?.rank || null;
      if (rank === null || !cardsHeld || cardsHeld === 0) {
        return null;
      }
      return {
        rank,
        path: builder.path,
        avatar: builder.avatar,
        points: receipt.value,
        cardsHeld,
        displayName: builder.displayName
      };
    })
    .filter(isTruthy)
    .sort((a, b) => b.points - a.points);
}
