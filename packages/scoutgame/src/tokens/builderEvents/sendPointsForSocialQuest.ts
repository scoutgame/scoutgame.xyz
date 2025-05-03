import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';

import { questsRecord, type QuestType } from '../../quests/questRecords';

export async function sendPointsForSocialQuest({
  builderId,
  week,
  type,
  tx,
  season
}: {
  season: string;
  type: QuestType;
  builderId: string;
  week: ISOWeek;
  tx?: Prisma.TransactionClient;
}) {
  const points = questsRecord[type].points;
  async function txHandler(_tx: Prisma.TransactionClient) {
    await _tx.scoutSocialQuest.create({
      data: {
        type,
        user: {
          connect: {
            id: builderId
          }
        },
        season,
        event: {
          create: {
            builderId,
            type: 'social_quest',
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
    return prisma.$transaction(txHandler, {
      timeout: 10000
    });
  }
}
