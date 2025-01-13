import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { getPlatform } from '@packages/mixpanel/utils';

export async function createReferralEvent(referralCode: string, refereeId: string) {
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

  const existingReferee = await prisma.referralCodeEvent.findFirst({
    where: {
      refereeId
    }
  });

  if (existingReferee) {
    throw new Error('Referee has already been referred');
  }

  const referrerId = referrer.id;

  const eventType: BuilderEventType = 'referral';

  const builderEvent = await prisma.builderEvent.create({
    data: {
      season: getCurrentSeasonStart(),
      type: eventType,
      description: `Received points for being a referrer`,
      week: getCurrentWeek(),
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
