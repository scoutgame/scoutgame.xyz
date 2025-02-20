import { getCurrentWeek, getDateFromISOWeek } from '@packages/dates/utils';
import { mockBuilder, mockScout } from '@packages/testing/database';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { v4 as uuid } from 'uuid';

import { getReferralsToReward } from '../getReferralsToReward';

describe('getReferralsToReward', () => {
  it('should return referrer and referees', async () => {
    const testWeek = '2025-W03';
    const { referrer, referees } = await mockUserWithReferral({ week: testWeek });

    const recipients = await getReferralsToReward({ week: testWeek });

    expect(recipients.map((connector) => connector.userId).sort()).toEqual(
      [referrer.id, ...referees.map((referee) => referee.id)].sort()
    );
  });

  it('should not return user if the referees did not complete the quest', async () => {
    const userId = uuid();
    await mockUserWithReferral({ week: getCurrentWeek() });

    const recipients = await getReferralsToReward({ week: getCurrentWeek() });
    const myUser = recipients.find((d) => d.userId === userId);
    expect(myUser).toBeUndefined();
  });
});

async function mockUserWithReferral({ week }: { week: string }) {
  const referrer = await mockScout({ verifiedEmail: true });
  const referees = await mockReferrals(referrer.referralCode, week);
  return { referrer, referees };
}

async function mockReferrals(referralCode: string, week: string) {
  const referees: Awaited<ReturnType<typeof mockScout>>[] = [];
  for (let j = 0; j < 5; j++) {
    const builder = await mockBuilder({ createNft: true });
    const referee = await mockScout({ verifiedEmail: true, builderId: builder.id });
    await createReferralEvent(referralCode, referee.id, week);
    await updateReferralUsers(referee.id, week, getDateFromISOWeek(week).plus({ days: 1 }).toJSDate());
    referees.push(referee);
  }
  return referees;
}
