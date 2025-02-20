import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { mockBuilder, mockScout } from '@packages/testing/database';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

import { getReferralsToReward } from '../getReferralsToReward';

const testWeek = getCurrentWeek();

describe('getReferralsToReward', () => {
  it('should return top 5 connectors with correct sorting for same points', async () => {
    const referrer1 = await mockUserWithReferral();
    // Wait for 1 second to ensure the createdAt date is different
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    const referrer2 = await mockUserWithReferral();
    const referrer3 = await mockUserWithReferral();
    await mockReferrals(referrer3.referralCode);

    const recipients = await getReferralsToReward({ week: testWeek });

    expect(recipients.map((connector) => connector.userId).slice(0, 3)).toEqual([
      referrer3.id,
      referrer1.id,
      referrer2.id
    ]);
  });

  it('should not return user in top 5 if the user did not refer anyone today', async () => {
    const userId = uuid();
    await mockUserWithReferral();

    const recipients = await getReferralsToReward({ week: testWeek });
    const myUser = recipients.find((d) => d.userId === userId);
    expect(myUser).toBeUndefined();
  });

  it('should return the top connectors when the referee onboarded time and builder scout time is different', async () => {
    const referrer1 = await mockScout({ verifiedEmail: true });
    const referrer2 = await mockScout({ verifiedEmail: true });

    const builder = await mockBuilder({ createNft: true });
    const referee1 = await mockScout({ verifiedEmail: true, builderId: builder.id });
    const referee2 = await mockScout({ verifiedEmail: true, builderId: builder.id });

    // Refer to referee1 using referrer1 referral code
    const builderEvent = await createReferralEvent(referrer1.referralCode, referee1.id);

    await updateReferralUsers(referee1.id);
    // Update the points receipt to have a different createdAt date
    await prisma.pointsReceipt.updateMany({
      where: { eventId: builderEvent.id },
      data: { createdAt: DateTime.now().plus({ days: 1 }).toJSDate() }
    });

    // Refer to referee2 using referrer2 referral code
    await createReferralEvent(referrer2.referralCode, referee2.id);

    await updateReferralUsers(referee2.id);

    const recipients = await getReferralsToReward({ week: testWeek });

    const referrerIds = recipients.map((connector) => connector.userId);

    expect(recipients.some((connector) => referrerIds.includes(connector.userId))).toBe(true);

    expect(
      recipients.every(
        (connector) =>
          connector.userId !== builder.id && connector.userId !== referee1.id && connector.userId !== referee2.id
      )
    ).toBe(true);
  });
});

async function mockUserWithReferral({ userId }: { userId?: string } = {}) {
  const referrer = await mockScout({ id: userId, verifiedEmail: true });
  await mockReferrals(referrer.referralCode);
  return referrer;
}

async function mockReferrals(referralCode: string) {
  for (let j = 0; j < 5; j++) {
    const builder = await mockBuilder({ createNft: true });
    const referee = await mockScout({ verifiedEmail: true, builderId: builder.id });
    await createReferralEvent(referralCode, referee.id);
    await updateReferralUsers(referee.id);
  }
}
