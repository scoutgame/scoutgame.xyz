import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';

import { createReferralEvent } from '../createReferralEvent';

describe('createReferralUsers', () => {
  it('should create a referral event with a valid referral code', async () => {
    const referral = await mockScout();
    const referee = await mockScout();
    await createReferralEvent(referral.referralCode || '', referee.id);

    const event = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        builderEvent: {
          builderId: referral.id
        },
        refereeId: referee.id
      }
    });

    expect(!!event?.id).toBeTruthy();
  });

  it('should throw error when referral code is invalid', async () => {
    const scout = await mockScout();

    const referralCode = 'INVALIDCODE';

    await expect(createReferralEvent(referralCode, scout.id)).rejects.toThrow('No Scout found');
  });
});
