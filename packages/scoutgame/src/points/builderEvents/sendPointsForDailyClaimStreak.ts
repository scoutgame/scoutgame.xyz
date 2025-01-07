import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeason, getCurrentWeek } from '@packages/dates/utils';

export async function sendPointsForDailyClaimStreak({
  builderId,
  week = getCurrentWeek(),
  points,
  tx
}: {
  builderId: string;
  points: number;
  week?: ISOWeek;
  tx?: Prisma.TransactionClient;
}) {
  const season = getCurrentSeason(week).start;
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
                season,
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
