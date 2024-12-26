import { prisma } from '@charmverse/core/prisma-client';

import { rewardPoints } from '../../constants';
import { mockBuilderEvent, mockScout } from '../../testing/database';
import { createReferralEvent } from '../createReferralEvent';
import { updateReferralUsers } from '../updateReferralUsers';

describe('updateReferralUsers', () => {
  it('should create a referral event with a valid referral code', async () => {
    const referral = await mockScout();
    const referee = await mockScout();
    await createReferralEvent(referral.referralCode || '', referee.id);
    await updateReferralUsers(referee.id);

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

  it('should update the current balance of the referrer and referee', async () => {
    const referrer = await mockScout({ currentBalance: 50 });
    const referee = await mockScout({ currentBalance: 0 });

    await createReferralEvent(referrer.referralCode || '', referee.id);

    const [updatedReferralUser, updatedRefereeUser] = await updateReferralUsers(referee.id);

    expect(updatedReferralUser.id).toBe(referrer.id);
    expect(updatedReferralUser.currentBalance).toBe(50 + rewardPoints);
    expect(updatedRefereeUser.id).toBe(referee.id);
    expect(updatedRefereeUser.currentBalance).toBe(rewardPoints);
  });
});
