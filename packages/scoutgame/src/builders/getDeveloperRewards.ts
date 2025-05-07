import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import { formatUnits } from 'viem';

export type DeveloperReward = {
  path: string;
  displayName: string;
  avatar: string | null;
  tokens: number;
  rank: number | null;
  cardsHeld: number;
};

export async function getSeasonDeveloperRewards({
  userId,
  season = getCurrentSeasonStart()
}: {
  userId: string;
  season?: string;
}): Promise<DeveloperReward[]> {
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
          },
          tokensReceived: {
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
      }
    }
  });

  const developerRewardsRecord: Record<string, DeveloperReward> = {};

  scout.wallets
    .flatMap((wallet) => wallet.tokensReceived)
    .forEach((receipt) => {
      const developer = receipt.event.builder;
      const developerId = developer.id;
      const cardsHeld = scout.wallets
        .flatMap((wallet) => wallet.purchaseEvents)
        .filter((event) => event.createdAt < receipt.createdAt && event.builderNft.builderId === developerId)
        .reduce((acc, event) => acc + event.tokensPurchased, 0);
      if (cardsHeld) {
        if (!developerRewardsRecord[developerId]) {
          developerRewardsRecord[developerId] = {
            path: developer.path,
            displayName: developer.displayName,
            avatar: developer.avatar,
            cardsHeld,
            tokens: 0,
            rank: null
          };
        }
        developerRewardsRecord[developerId].tokens += Number(formatUnits(BigInt(receipt.value), 18));
      }
    });

  return Object.values(developerRewardsRecord).sort((a, b) => b.tokens - a.tokens);
}

export async function getWeeklyDeveloperRewards({
  userId,
  week
}: {
  userId: string;
  week: string;
}): Promise<DeveloperReward[]> {
  const season = getCurrentSeasonStart(week);
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: {
        include: {
          tokensReceived: {
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
          },
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

  return scout.wallets
    .flatMap((wallet) => wallet.tokensReceived)
    .map((receipt) => {
      const developer = receipt.event.builder;
      const cardsHeld = builderTokensRecord[developer.id];
      const rank = developer.userWeeklyStats[0]?.rank || null;
      if (rank === null || !cardsHeld || cardsHeld === 0) {
        return null;
      }
      return {
        rank,
        path: developer.path,
        avatar: developer.avatar,
        tokens: Number(formatUnits(BigInt(receipt.value), 18)),
        cardsHeld,
        displayName: developer.displayName
      };
    })
    .filter(isTruthy)
    .sort((a, b) => b.tokens - a.tokens);
}
