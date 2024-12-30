import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { currentSeason } from '@packages/scoutgame/dates';
import { baseUrl } from '@packages/utils/constants';

import { rewardPoints } from '../constants';
import { BasicUserInfoSelect } from '../users/queries';

export async function updateReferralUsers(refereeId: string) {
  const referralCodeEvent = await prisma.referralCodeEvent.findFirst({
    where: {
      refereeId,
      completedAt: null
    },
    include: {
      builderEvent: true
    }
  });

  if (!referralCodeEvent) {
    // The user was not referred
    return [];
  }

  const referrerId = referralCodeEvent.builderEvent.builderId;

  const txs = await prisma.$transaction(async (tx) => {
    // Update referrer
    const referrer = await tx.scout.update({
      where: {
        id: referrerId
      },
      data: {
        currentBalance: {
          increment: rewardPoints
        }
      },
      select: {
        ...BasicUserInfoSelect,
        email: true
      }
    });

    const referrerPointsReceived = await tx.pointsReceipt.create({
      data: {
        value: rewardPoints,
        season: currentSeason,
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
    const referee = await tx.scout.update({
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
            season: currentSeason
          }
        }
      },
      select: BasicUserInfoSelect
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
      referralCode: referrer.referralCode,
      referrerPath: referrer.path
    });

    return [referrer, referee] as const;
  });

  const [referrer, referee] = txs;

  if (referrer.email) {
    try {
      await sendEmailTemplate({
        to: {
          email: referrer.email,
          userId: referrer.id
        },
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
      log.error('Error sending email', { error, userId: referrer.id });
    }
  }

  return txs;
}
