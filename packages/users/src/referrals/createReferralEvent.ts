import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { getPlatform } from '@packages/mixpanel/platform';

export async function createReferralEvent(referralCode: string, refereeId: string, week = getCurrentWeek()) {
  const season = getCurrentSeasonStart(week);
  const referrer = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      deletedAt: true,
      id: true
    }
  });

  if (referrer.deletedAt) {
    throw new Error('Referrer has been banned');
  }

  const referrerId = referrer.id;

  const eventType: BuilderEventType = 'referral';

  const builderEvent = await prisma.builderEvent.create({
    data: {
      season,
      type: eventType,
      description: `Received reward for being a referrer`,
      week,
      builderId: referrerId,
      referralCodeEvent: {
        create: {
          refereeId,
          platform: getPlatform()
        }
      }
    }
  });

  return builderEvent;
}
