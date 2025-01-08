import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { baseUrl } from '@packages/utils/constants';

import { rewardPoints } from '../constants';
import { BasicUserInfoSelect } from '../queries';

export async function updateReferralUsers(refereeId: string) {
  const referralCodeEvents = await prisma.referralCodeEvent.findMany({
    where: {
      refereeId
    },
    include: {
      builderEvent: true
    }
  });

  if (referralCodeEvents.some((e) => !!e.completedAt)) {
    log.debug('Ignore referral because referee has already been referred', { userId: refereeId });
    return;
  }

  const referralCodeEvent = referralCodeEvents[0];

  if (!referralCodeEvent) {
    // The user was not referred
    return;
  }

  if (referralCodeEvents.length > 1) {
    log.debug('Unexpected state: referee has multiple referral events', { userId: refereeId });
  }

  const referee = await prisma.scout.findUniqueOrThrow({
    where: {
      id: refereeId
    },
    include: {
      emailVerifications: true
    }
  });

  if (!referee.emailVerifications.some((e) => !!e.completedAt)) {
    log.debug('Ignore referral because referee has not verified their email', { userId: refereeId });
    return;
  }

  const referrerId = referralCodeEvent.builderEvent.builderId;

  const referrer = await prisma.$transaction(
    async (tx) => {
      // Update referrer
      const _referrer = await tx.scout.update({
        where: {
          id: referrerId
        },
        data: {
          currentBalance: {
            increment: rewardPoints
          }
        },
        select: {
          id: true,
          displayName: true,
          path: true,
          referralCode: true
        }
      });

      const referrerPointsReceived = await tx.pointsReceipt.create({
        data: {
          value: rewardPoints,
          season: getCurrentSeasonStart(),
          claimedAt: new Date(),
          recipient: {
            connect: {
              id: referrerId
            }
          },
          event: {
            connect: {
              id: referralCodeEvent.builderEvent.id
            }
          }
        }
      });

      // Update referee
      await tx.scout.update({
        where: {
          id: refereeId
        },
        data: {
          currentBalance: {
            increment: rewardPoints
          },
          pointsReceived: {
            create: {
              value: rewardPoints,
              claimedAt: new Date(),
              eventId: referrerPointsReceived.eventId,
              season: getCurrentSeasonStart()
            }
          }
        }
      });

      await prisma.referralCodeEvent.update({
        where: {
          id: referralCodeEvent.id
        },
        data: {
          completedAt: new Date()
        }
      });

      trackUserAction('referral_link_used', {
        userId: refereeId,
        referralCode: _referrer.referralCode,
        referrerPath: _referrer.path
      });

      return _referrer;
    },
    {
      timeout: 10000
    }
  );

  try {
    await sendEmailTemplate({
      userId: referrer.id,
      senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
      subject: 'Someone Joined Scout Game Using Your Referral! 🎉',
      template: 'Referral link signup',
      templateVariables: {
        name: referrer.displayName,
        scout_name: referee.displayName,
        scout_profile_link: `${baseUrl}/u/${referee.path}`
      }
    });
  } catch (error) {
    log.error('Error sending referral email', { error, userId: referrer.id });
  }
}
