import type { BuilderEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getPlatform } from '@packages/mixpanel/utils';

import { getCurrentSeasonStart, getCurrentWeek } from '../dates/utils';

export async function createReferralEvent(referralCode: string, refereeId: string) {
  const referrer = await prisma.scout.findUniqueOrThrow({
    where: {
      referralCode
    },
    select: {
      id: true
    }
  });

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
