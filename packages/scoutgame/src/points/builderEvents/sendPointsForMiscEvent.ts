import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ISOWeek } from '../../dates';
import { currentSeason, getCurrentWeek } from '../../dates';
import { incrementPointsEarnedStats } from '../updatePointsEarned';

export async function sendPointsForMiscEvent({
  builderId,
  season = currentSeason,
  week = getCurrentWeek(),
  points,
  description,
  earnedAs,
  claimed,
  hideFromNotifications = false,
  tx
}: {
  builderId: string;
  points: number;
  season?: ISOWeek;
  week?: ISOWeek;
  description: string;
  claimed: boolean;
  earnedAs?: 'scout';
  hideFromNotifications?: boolean;
  tx?: Prisma.TransactionClient;
}) {
  async function txHandler(_tx: Prisma.TransactionClient) {
    await _tx.builderEvent.create({
      data: {
        builderId,
        type: 'misc_event',
        week,
        season,
        description,
        pointsReceipts: {
          create: {
            claimedAt: claimed ? new Date() : null,
            value: points,
            recipientId: builderId,
            activities: hideFromNotifications
              ? undefined
              : {
                  create: {
                    type: 'points',
                    userId: builderId,
                    recipientType: !earnedAs ? 'scout' : earnedAs
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

    if (earnedAs) {
      if (earnedAs !== 'scout') {
        throw new Error(`Invalid earnedAs: ${earnedAs}`);
      }
      await incrementPointsEarnedStats({
        season,
        userId: builderId,
        // builderPoints: earnedAs === 'builder' ? points : 0,
        scoutPoints: earnedAs === 'scout' ? points : 0,
        tx: _tx
      });
    }
  }

  if (tx) {
    return txHandler(tx);
  } else {
    return prisma.$transaction(txHandler);
  }
}
