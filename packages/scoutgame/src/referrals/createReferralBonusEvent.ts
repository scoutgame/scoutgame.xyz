import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { referralBonusPoints } from '../constants';
import { currentSeason, getCurrentWeek } from '../dates';

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

  // If the referral code event exists and doesn't have a bonus event, create one
  if (referrerId && !referralCodeEvent.bonusBuilderEvent) {
    await prisma.$transaction(async (tx) => {
      await tx.builderEvent.create({
        data: {
          type: 'referral_bonus',
          season: currentSeason,
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
              season: currentSeason
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
}
