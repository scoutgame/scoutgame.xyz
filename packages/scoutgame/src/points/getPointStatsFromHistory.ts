import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { validate as isUuid } from 'uuid';

import type { ISOWeek } from '../dates/config';

export type PointStats = {
  userId: string;
  pointsReceivedAsScout: number;
  pointsReceivedAsBuilder: number;
  bonusPointsReceived: number;
  pointsSpent: number;
  claimedPoints: number;
  unclaimedPoints: number;
  balance: number;
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

  const userId = await tx.scout
    .findUniqueOrThrow({
      where: isUuid(userIdOrPath) ? { id: userIdOrPath } : { path: userIdOrPath },
      select: {
        id: true
      }
    })
    .then((user) => user.id);

  const [
    pointsSpentRecords,
    pointsReceivedAsBuilderRecords,
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
    // Points received as scout
    tx.pointsReceipt.findMany({
      where: {
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
            in: ['misc_event', 'daily_claim', 'social_quest', 'daily_claim_streak', 'referral']
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

  const pointsReceivedAsBuilder = pointsReceivedAsBuilderRecords.reduce((acc, { value }) => acc + value, 0);
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
    log.warn(`All points received sum does not match breakdown`, {
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
    userId
  };
}
