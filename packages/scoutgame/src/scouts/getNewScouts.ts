import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import type { Address } from 'viem';

import { getEstimatedPointsForWeek } from '../points/getEstimatedPointsForWeek';

export type NewScout = {
  id: string;
  address: Address;
  path: string;
  displayName: string;
  avatar: string | null;
  pointsPredicted: number;
  buildersScouted: number;
  starterPacks: number;
  nftsHeld: number;
  earliestPurchasedAt: Date | undefined;
};

// look at gems instead of points for current week
export async function getRankedNewScoutsForCurrentWeek({
  week = getCurrentWeek()
}: {
  week?: string;
} = {}): Promise<NewScout[]> {
  const [{ pointsPerScout: _pointsPerScout, nftPurchaseEvents: _nftPurchaseEvents }, newScouts] = await Promise.all([
    getEstimatedPointsForWeek({ week }),
    getNewScouts({ week })
  ]);

  return (
    newScouts
      .map((scout): NewScout => {
        const scoutTransactions = _nftPurchaseEvents.filter((event) => event.to?.scoutId === scout.id);
        const buildersScouted = Array.from(new Set(scoutTransactions.map((event) => event.builderNft.builderId)));
        const starterPacks = scoutTransactions.filter((event) => event.builderNft.nftType === 'starter_pack').length;
        const nftsHeld = scoutTransactions.reduce((acc, event) => acc + event.tokensPurchased, 0);
        return {
          id: scout.id,
          address: scout.wallets.find((w) => w.primary)?.address as Address,
          path: scout.path,
          displayName: scout.displayName,
          avatar: scout.avatar,
          buildersScouted: buildersScouted.length,
          starterPacks,
          pointsPredicted: _pointsPerScout[scout.id] ?? 0,
          nftsHeld,
          // Check the first purchase event for each wallet as they are already sorted in ascending order
          earliestPurchasedAt: scout.wallets
            .sort(
              (a, b) =>
                (a.purchaseEvents.at(0)?.createdAt?.getTime() ?? 0) -
                (b.purchaseEvents.at(0)?.createdAt?.getTime() ?? 0)
            )
            .at(0)
            ?.purchaseEvents.at(0)?.createdAt
        };
      })
      // scouts may own NFT of builders that have no points yet
      // .filter((scout) => scout.pointsPredicted > 0)
      .sort((a, b) => {
        const pointsA = a.pointsPredicted;
        const pointsB = b.pointsPredicted;
        if (pointsA === pointsB) {
          const nftsHeldA = a.nftsHeld;
          const nftsHeldB = b.nftsHeld;
          if (nftsHeldA === nftsHeldB) {
            const earliestPurchasedAtA = a.earliestPurchasedAt;
            const earliestPurchasedAtB = b.earliestPurchasedAt;
            // Sort by earliest purchase date
            return (earliestPurchasedAtA?.getTime() ?? 0) - (earliestPurchasedAtB?.getTime() ?? 0);
          }
          return nftsHeldB - nftsHeldA;
        }
        return pointsB - pointsA;
      })
  );
}

// TODO: cache the pointsEarned as part of userWeeklyStats like we do in userSeasonStats
export async function getRankedNewScoutsForPastWeek({
  week
}: {
  week: string;
}): Promise<(Omit<NewScout, 'pointsPredicted'> & { pointsEarned: number })[]> {
  const season = getCurrentSeason(week).start;
  const [receipts, newScouts] = await Promise.all([
    prisma.pointsReceipt.findMany({
      where: {
        event: {
          type: 'gems_payout',
          season,
          week
        }
      },
      include: {
        event: {
          include: { gemsPayoutEvent: true }
        }
      }
    }),
    getNewScouts({ week })
  ]);

  // remove receipts for builder payout
  const scoutReceipts = receipts.filter((receipt) => receipt.event.builderId !== receipt.recipientId);
  // create a map of userId to pointsEarned
  const pointsEarnedByUserId = scoutReceipts.reduce<Record<string, number>>((acc, receipt) => {
    acc[receipt.recipientId!] = (acc[receipt.recipientId!] || 0) + receipt.value;
    return acc;
  }, {});
  // create a list of users sorted by pointsEarned
  const sortedUsers = Object.entries(pointsEarnedByUserId).sort((a, b) => b[1] - a[1]);
  return (
    sortedUsers
      // only include new scouts
      .filter((user) => newScouts.find((s) => s.id === user[0]))
      .map((user) => {
        const scout = newScouts.find((s) => s.id === user[0])!;
        const address = scout?.wallets.find((w) => w.primary)?.address as Address;
        const nftsHeld = scout.wallets.reduce(
          (acc, w) => acc + w.purchaseEvents.reduce((_acc, e) => _acc + e.tokensPurchased, 0),
          0
        );
        return {
          ...scout,
          address,
          pointsEarned: pointsEarnedByUserId[user[0]],
          buildersScouted:
            scout?.wallets.reduce(
              (acc, w) => acc + w.purchaseEvents.reduce((_acc, e) => _acc + e.tokensPurchased, 0),
              0
            ) ?? 0,
          nftsHeld,
          starterPacks: scout?.wallets.reduce(
            (acc, w) => acc + w.purchaseEvents.filter((e) => e.builderNft.nftType === 'starter_pack').length,
            0
          ),
          earliestPurchasedAt: scout?.wallets
            .sort(
              (a, b) =>
                // Check the first purchase event for each wallet as they are already sorted in ascending order
                (a.purchaseEvents.at(0)?.createdAt?.getTime() ?? 0) -
                (b.purchaseEvents.at(0)?.createdAt?.getTime() ?? 0)
            )
            .at(0)
            ?.purchaseEvents.at(0)?.createdAt
        };
      })
      .sort((a, b) => {
        const pointsA = a.pointsEarned;
        const pointsB = b.pointsEarned;
        if (pointsA === pointsB) {
          const buildersScoutedA = a.buildersScouted;
          const buildersScoutedB = b.buildersScouted;
          if (buildersScoutedA === buildersScoutedB) {
            return (a.earliestPurchasedAt?.getTime() ?? 0) - (b.earliestPurchasedAt?.getTime() ?? 0);
          }
          return buildersScoutedB - buildersScoutedA;
        }
        return pointsB - pointsA;
      })
      .filter((scout) => scout.address)
  );
}

// new Scout definition: only scouts that purchased NFT this week for the first time
export async function getNewScouts({ week, season: testSeason }: { week: string; season?: string }) {
  const season = testSeason || getCurrentSeason(week).start;
  const newScouts = await prisma.scout.findMany({
    where: {
      deletedAt: null,
      // Has purchases this week
      wallets: {
        some: {
          purchaseEvents: {
            some: {
              builderEvent: {
                season,
                week
              }
            }
          }
        }
      },
      // Does NOT have purchases in earlier weeks
      NOT: {
        wallets: {
          some: {
            purchaseEvents: {
              some: {
                builderEvent: {
                  season,
                  week: {
                    lt: week
                  }
                }
              }
            }
          }
        }
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      wallets: {
        select: {
          address: true,
          primary: true,
          purchaseEvents: {
            where: {
              builderNft: {
                season
              }
            },
            orderBy: {
              createdAt: 'asc'
            },
            select: {
              tokensPurchased: true,
              createdAt: true,
              builderNft: {
                select: {
                  nftType: true
                }
              }
            }
          }
        }
      }
    }
  });
  return newScouts;
}
