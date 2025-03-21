import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { validate as isUuid } from 'uuid';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  bonusPointsReceived: number;
  pointsSpent: number;
  claimedPoints: number;
  unclaimedPoints: number;
  balance: number;
  balanceOnScoutProfile: number;
};

const include: Prisma.PointsReceiptInclude = {
  event: true,
  activities: true
};

export async function getPointStatsFromHistory({
  userIdOrPath,
  tx = prisma,
  season
}: {
  userIdOrPath: string;
  season: ISOWeek;
  tx?: Prisma.TransactionClient;
}): Promise<PointStats> {
  if (!userIdOrPath) {
    throw new InvalidInputError('userIdOrPath is required');
  }

  const user = await tx.scout.findUniqueOrThrow({
    where: isUuid(userIdOrPath) ? { id: userIdOrPath } : { path: userIdOrPath },
    select: {
      id: true,
      currentBalance: true
    }
  });

  const userId = user.id;

  const [
    pointsSpentRecords,
    pointsReceivedAsBuilderRecords,
    pointsReceivedForSellingNFTsRecords,
    pointsReceivedAsScoutRecords,
    bonusPointsReceivedRecords,
    allPointsReceivedRecords
  ] = await Promise.all([
    // Points spent
    tx.pointsReceipt.findMany({
      where: {
        season,
        senderId: userId
      }
    }),
    // Points received as builder
    tx.pointsReceipt.findMany({
      where: {
        season,
        recipientId: userId,
        event: {
          type: 'gems_payout'
        },
        // we need to filter out points received when you own your own NFT
        activities: {
          some: {
            recipientType: 'builder'
          }
        }
      },
      include
    }),
    tx.pointsReceipt.findMany({
      where: {
        season,
        recipientId: userId,
        event: {
          type: 'nft_purchase'
        }
      }
    }),
    // Points received as scout
    tx.pointsReceipt.findMany({
      where: {
        season,
        recipientId: userId,
        event: {
          type: 'gems_payout'
        },
        // we need to include points received when you own your own NFT
        activities: {
          some: {
            recipientType: 'scout'
          }
        }
      },
      include
    }),
    // Bonus points received
    tx.pointsReceipt.findMany({
      where: {
        season,
        recipientId: userId,
        event: {
          type: {
            in: ['misc_event', 'daily_claim', 'social_quest', 'daily_claim_streak', 'referral', 'referral_bonus']
          }
        }
      }
    }),
    // All points received
    tx.pointsReceipt.findMany({
      where: {
        season,
        recipientId: userId
      },
      include
    })
  ]);

  const pointsSpent = pointsSpentRecords.reduce((acc, { value }) => acc + value, 0);

  const pointsReceivedForSellingNFTs = pointsReceivedForSellingNFTsRecords.reduce((acc, { value }) => acc + value, 0);

  const pointsReceivedAsBuilder =
    pointsReceivedAsBuilderRecords.reduce((acc, { value }) => acc + value, 0) + pointsReceivedForSellingNFTs;
  const pointsReceivedAsScout = pointsReceivedAsScoutRecords.reduce((acc, { value }) => acc + value, 0);
  const bonusPointsReceived = bonusPointsReceivedRecords.reduce((acc, { value }) => acc + value, 0);

  const allPointsReceived = allPointsReceivedRecords.reduce((acc, { value }) => acc + value, 0);

  const allPointsReceivedSum = pointsReceivedAsBuilder + pointsReceivedAsScout + bonusPointsReceived;

  const claimedPoints = allPointsReceivedRecords
    .filter((record) => !!record.claimedAt)
    .reduce((acc, { value }) => acc + value, 0);

  const unclaimedPoints = allPointsReceivedRecords
    .filter((record) => !record.claimedAt)
    .reduce((acc, { value }) => acc + value, 0);

  const balance = claimedPoints - pointsSpent;

  if (allPointsReceived !== allPointsReceivedSum) {
    log.error(`All points received sum does not match breakdown`, {
      userId,
      allPointsReceived,
      allPointsReceivedSum,
      pointsReceivedAsBuilder,
      pointsReceivedAsScout,
      bonusPointsReceived
    });
  }

  return {
    balance,
    claimedPoints,
    unclaimedPoints,
    pointsReceivedAsBuilder,
    pointsReceivedAsScout,
    bonusPointsReceived,
    pointsSpent,
    userId,
    balanceOnScoutProfile: user.currentBalance || 0
  };
}
