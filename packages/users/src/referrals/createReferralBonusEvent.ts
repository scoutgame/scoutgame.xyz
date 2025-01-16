import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { referralBonusPoints } from '../constants';

export async function createReferralBonusEvent(refereeId: string) {
  const referralCodeEvent = await prisma.referralCodeEvent.findFirst({
    where: {
      refereeId
    },
    select: {
      id: true,
      bonusBuilderEvent: true,
      builderEvent: {
        select: {
          builderId: true,
          builder: {
            select: {
              deletedAt: true
            }
          }
        }
      }
    }
  });

  if (referralCodeEvent?.bonusBuilderEvent) {
    log.info('Referral bonus event already exists', {
      referralCodeEventId: referralCodeEvent.id
    });
    return { result: 'already_referred' };
  }

  const referrerId = referralCodeEvent?.builderEvent?.builderId;

  if (!referrerId) {
    log.info('Referrer not found. Skipping referral bonus event', {
      refereeId,
      referralCodeEventId: referralCodeEvent?.id
    });
    return { result: 'referrer_not_found' };
  }

  const isReferrerDeleted = referralCodeEvent?.builderEvent?.builder.deletedAt !== null;

  if (isReferrerDeleted) {
    log.info('Referrer deleted. Skipping referral bonus event', {
      refereeId,
      referrerId
    });
    return { result: 'referrer_deleted' };
  }

  const refereeEmailVerifications = await prisma.scoutEmailVerification.count({
    where: {
      scoutId: refereeId,
      completedAt: {
        not: null
      }
    }
  });

  if (refereeEmailVerifications === 0) {
    log.info('Referee email not verified. Skipping referral bonus event', {
      refereeId,
      referrerId
    });
    return { result: 'referee_not_verified' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.builderEvent.create({
      data: {
        type: 'referral_bonus',
        season: getCurrentSeasonStart(),
        description: 'Received points for a referred user scouting a builder',
        week: getCurrentWeek(),
        builder: {
          connect: {
            id: referrerId
          }
        },
        referralBonusEvent: {
          connect: {
            id: referralCodeEvent.id
          }
        },
        pointsReceipts: {
          create: {
            value: referralBonusPoints,
            claimedAt: new Date(),
            recipient: {
              connect: {
                id: referrerId
              }
            },
            season: getCurrentSeasonStart()
          }
        }
      }
    });

    await tx.scout.update({
      where: {
        id: referrerId
      },
      data: {
        currentBalance: {
          increment: referralBonusPoints
        }
      }
    });

    trackUserAction('referral_bonus', {
      userId: refereeId,
      referrerId
    });
  });

  return { result: 'referral_bonus_created' };
}
