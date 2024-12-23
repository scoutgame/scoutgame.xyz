import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ISOWeek } from '../../dates';
import { currentSeason, getCurrentWeek } from '../../dates';
import { incrementPointsEarnedStats } from '../updatePointsEarned';

export async function sendPointsForDailyClaimStreak({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  tx
}: {
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  tx?: Prisma.TransactionClient;
}) {
  async function txHandler(_tx: Prisma.TransactionClient) {
    await _tx.scoutDailyClaimStreakEvent.create({
      data: {
        week,
        user: {
          connect: {
            id: builderId
          }
        },
        event: {
          create: {
            builderId,
            type: 'daily_claim_streak',
            week,
            season,
            pointsReceipts: {
              create: {
                claimedAt: new Date(),
                value: points,
                recipientId: builderId,
                activities: {
                  create: {
                    type: 'points',
                    userId: builderId,
                    recipientType: 'builder'
                  }
                }
              }
            }
          }
        }
      }
    });

    await _tx.scout.update({
      where: {
        id: builderId
      },
      data: {
        currentBalance: {
          increment: points
        }
      }
    });
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}
