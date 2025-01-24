import { mockBuilder, mockScout } from '@packages/testing/database';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { v4 as uuid } from 'uuid';

import { getTop5ConnectorsToday, getTopConnectorOfTheDay } from '../getTopConnectors';

describe('getTopConnectors', () => {
  describe('getTop5ConnectorsToday', () => {
    it('should return user in top 5 if the user is in the list of referrals today ', async () => {
      const referrer = await mockUserWithReferral();

      const connectors = await getTop5ConnectorsToday(referrer.id);
      const myUserIndex = connectors.findIndex((d) => d.builderId === referrer.id);
      expect(connectors.length).toBe(5);
      expect(myUserIndex).toBeLessThanOrEqual(4);
    });

    it('should not return user in top 5 if the user did not refer anyone today', async () => {
      const userId = uuid();
      await mockUserWithReferral();

      const connectors = await getTop5ConnectorsToday(userId);
      const myUser = connectors.find((d) => d.builderId === userId);
      expect(myUser).toBeUndefined();
    });
  });

  describe('getTopConnectorOfTheDay', () => {
    it('should return the top connector of the day', async () => {
      await mockUserWithReferral();

      const topConnector = await getTopConnectorOfTheDay();
      expect(topConnector).toBeDefined();
    });
  });
});

async function mockUserWithReferral({ userId }: { userId?: string } = {}) {
  const referrer = await mockScout({ id: userId, verifiedEmail: true });

  for (let j = 0; j < 5; j++) {
    const builder = await mockBuilder({ createNft: true });
    const referee = await mockScout({ verifiedEmail: true, builderId: builder.id });
    await createReferralEvent(referrer.referralCode || '', referee.id);
    await updateReferralUsers(referee.id);
  }
  return referrer;
}
