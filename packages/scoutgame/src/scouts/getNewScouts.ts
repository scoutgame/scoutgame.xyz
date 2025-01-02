import { prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeason, getCurrentWeek } from '../dates/utils';
import { dividePointsBetweenBuilderAndScouts } from '../points/dividePointsBetweenBuilderAndScouts';
import { getWeeklyPointsPoolAndBuilders } from '../points/getWeeklyPointsPoolAndBuilders';

export type NewScout = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  pointsPredicted: number;
  buildersScouted: number;
  nftsHeld: number;
};

// look at gems instead of points for current week
export async function getRankedNewScoutsForCurrentWeek({
  week = getCurrentWeek()
}: {
  week?: string;
} = {}): Promise<NewScout[]> {
  const [{ pointsPerScout: _pointsPerScout, nftPurchaseEvents: _nftPurchaseEvents }, newScouts] = await Promise.all([
    (async function calculatePointsPerScout() {
      const { normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints, nftPurchaseEvents } =
        await getWeeklyPointsPoolAndBuilders({
          week
        });
      // aggregate values for each scout per topWeeklyBuilder
      const pointsPerScout: Record<string, number> = {};

      topWeeklyBuilders.forEach((builder) => {
        const { pointsPerScout: builderPointsPerScout } = dividePointsBetweenBuilderAndScouts({
          builderId: builder.builder.id,
          rank: builder.rank,
          weeklyAllocatedPoints,
          normalisationFactor,
          nftPurchaseEvents
        });
        builderPointsPerScout.forEach(({ scoutId, scoutPoints }) => {
          pointsPerScout[scoutId] = (pointsPerScout[scoutId] || 0) + scoutPoints;
        });
      });
      return {
        nftPurchaseEvents,
        pointsPerScout
      };
    })(),
    getNewScouts({ week })
  ]);

  return (
    newScouts
      .map((scout): NewScout => {
        const scoutTransactions = _nftPurchaseEvents.filter((event) => event.scoutId === scout.id);
        const buildersScouted = Array.from(new Set(scoutTransactions.map((event) => event.builderNft.builderId)));
        const nftsHeld = scoutTransactions.reduce((acc, event) => acc + event.tokensPurchased, 0);
        return {
          id: scout.id,
          path: scout.path,
          displayName: scout.displayName,
          avatar: scout.avatar,
          buildersScouted: buildersScouted.length,
          pointsPredicted: _pointsPerScout[scout.id] ?? 0,
          nftsHeld
        };
      })
      // scouts may own NFT of builders that have no points yet
      // .filter((scout) => scout.pointsPredicted > 0)
      .sort((a, b) => {
        return b.pointsPredicted - a.pointsPredicted;
      })
  );
}

// TODO: cache the pointsEarned as part of userWeeklyStats like we do in userSeasonStats
export async function getRankedNewScoutsForPastWeek({ week }: { week: string }) {
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
      .map((user) => ({
        ...newScouts.find((u) => u.id === user[0]),
        pointsEarned: pointsEarnedByUserId[user[0]]
      }))
  );
}

// new Scout definition: only scouts that purchased NFT this week for the first time
export async function getNewScouts({ week }: { week: string }) {
  const season = getCurrentSeason(week).start;
  return prisma.scout.findMany({
    where: {
      deletedAt: null,
      nftPurchaseEvents: {
        every: {
          // every nft purchase event must have been purchased this week or later
          builderEvent: {
            week: {
              gte: week
            },
            season
          }
        },
        // at least one NFT was purchased this week
        some: {
          builderEvent: {
            week,
            season
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
          address: true
        }
      }
    }
  });
}
