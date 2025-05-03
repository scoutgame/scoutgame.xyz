import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { formatUnits } from 'viem';

export type TopScout = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  developersScouted: number;
  nftsHeld: number;
  allTimeTokens?: number;
  seasonTokens?: number;
};

export async function getTopScouts({ limit }: { limit: number }): Promise<TopScout[]> {
  const topScouts = await prisma.userSeasonStats.findMany({
    where: {
      season: getCurrentSeasonStart()
    },
    orderBy: {
      pointsEarnedAsScout: 'desc'
    },
    take: limit,
    select: {
      pointsEarnedAsScout: true,
      user: {
        select: {
          id: true,
          path: true,
          displayName: true,
          avatar: true,
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
          },
          userAllTimeStats: {
            select: {
              pointsEarnedAsScout: true
            }
          },
          userSeasonStats: {
            where: {
              season: getCurrentSeasonStart()
            },
            select: {
              nftsPurchased: true
            }
          }
        }
      }
    }
  });
  return topScouts
    .map((scout) => {
      const developersScouted = new Set(
        scout.user.wallets.flatMap((wallet) => wallet.scoutedNfts.map((nft) => nft.builderNft.builderId))
      ).size;
      const nftsHeld = scout.user.userSeasonStats[0]?.nftsPurchased || 0;
      const allTimeTokens = scout.user.userAllTimeStats[0]?.pointsEarnedAsScout || 0;
      const seasonTokens = scout.pointsEarnedAsScout;
      return {
        id: scout.user.id,
        path: scout.user.path,
        displayName: scout.user.displayName,
        avatar: scout.user.avatar,
        developersScouted,
        nftsHeld,
        allTimeTokens,
        seasonTokens
      };
    })
    .sort((a, b) => {
      const seasonTokensDifference = b.seasonTokens - a.seasonTokens;
      if (seasonTokensDifference !== 0) {
        return seasonTokensDifference;
      }
      const allTimeTokensDifference = b.allTimeTokens - a.allTimeTokens;
      if (allTimeTokensDifference !== 0) {
        return allTimeTokensDifference;
      }
      const nftsHeldDifference = b.nftsHeld - a.nftsHeld;
      if (nftsHeldDifference !== 0) {
        return nftsHeldDifference;
      }
      return 0;
    })
    .filter((scout) => scout.seasonTokens || scout.allTimeTokens || scout.nftsHeld);
}

// TODO: cache the pointsEarned as part of userWeeklyStats like we do in userSeasonStats
export async function getTopScoutsByWeek({ week, limit = 10 }: { week: string; limit?: number }) {
  const receipts = await prisma.tokensReceipt.findMany({
    where: {
      event: {
        type: 'gems_payout',
        season: getCurrentSeasonStart(),
        week
      }
    },
    select: {
      event: {
        select: {
          builderId: true
        }
      },
      recipientWallet: {
        select: {
          scoutId: true
        }
      },
      value: true
    }
  });
  const scoutReceipts = receipts
    .filter((receipt) => receipt.recipientWallet && receipt.event.builderId !== receipt.recipientWallet.scoutId)
    .map((receipt) => ({
      scoutId: receipt.recipientWallet?.scoutId as string,
      tokens: Number(formatUnits(BigInt(receipt.value), 18))
    }));
  // create a map of userId to pointsEarned
  const tokensEarnedByUserId = scoutReceipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.scoutId] = (acc[receipt.scoutId] || 0) + receipt.tokens;
    return acc;
  }, {});
  // create a list of users sorted by pointsEarned
  const sortedUsers = Object.entries(tokensEarnedByUserId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const users = await prisma.scout.findMany({
    where: {
      id: {
        in: sortedUsers.map((user) => user[0])
      },
      deletedAt: null
    }
  });

  return sortedUsers.map((user) => ({
    ...users.find((u) => u.id === user[0]),
    tokensEarned: tokensEarnedByUserId[user[0]]
  }));
}
