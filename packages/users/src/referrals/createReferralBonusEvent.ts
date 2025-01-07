import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { referralBonusPoints } from '../constants';
import { getCurrentSeasonStart, getCurrentWeek } from '../dates/utils';

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
          builderId: true
        }
      }
    }
  });

  const referrerId = referralCodeEvent?.builderEvent?.builderId;

  if (!referrerId) {
    throw new Error('Referrer not found');
  }

  if (referralCodeEvent?.bonusBuilderEvent) {
    throw new Error('Referral bonus event already exists');
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
}
