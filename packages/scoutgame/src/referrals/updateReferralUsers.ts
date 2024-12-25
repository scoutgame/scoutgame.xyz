import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { rewardPoints } from '../constants';
import { currentSeason, getCurrentWeek } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

export async function updateReferralUsers(referralCode: string, refereeId: string) {
  const initialReferrer = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      id: true,
      displayName: true,
      email: true
    }
  });

  const referrerId = initialReferrer?.id;

  const eventType: BuilderEventType = 'referral';

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
      select: BasicUserInfoSelect
    });

    const referrerPointsReceived = await tx.pointsReceipt.create({
      data: {
        value: rewardPoints,
        claimedAt: new Date(),
        recipient: {
          connect: {
            id: referrerId
          }
        },
        event: {
          create: {
            season: currentSeason,
            type: eventType,
            description: `Received points for being a referrer`,
            week: getCurrentWeek(),
            builderId: referrerId,
            referralCodeEvent: {
              create: {
                refereeId,
                platform: 'telegram'
              }
            }
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
            eventId: referrerPointsReceived.eventId
          }
        }
      },
      select: BasicUserInfoSelect
    });

    trackUserAction('referral_link_used', {
      userId: refereeId,
      referralCode,
      referrerPath: referrer.path
    });

    return [referrer, referee];
  });

  const referee = await prisma.scout.findUniqueOrThrow({
    where: {
      id: refereeId
    },
    select: {
      displayName: true,
      path: true
    }
  });

  if (initialReferrer.email) {
    await sendEmailTemplate({
      to: {
        email: initialReferrer.email,
        userId: initialReferrer.id
      },
      senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
      subject: 'Someone Joined Scout Game Using Your Referral! 🎉',
      template: 'Referral link signup',
      templateVariables: {
        name: initialReferrer.displayName,
        scout_name: referee.displayName,
        scout_profile_link: `https://scoutgame.xyz/u/${referee.path}`
      }
    });
  }

  return txs;
}
