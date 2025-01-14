import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';
import { createReferralEvent } from '@packages/users/referrals/createReferralEvent';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { v4 as uuid, v4 } from 'uuid';

import { getTop5ConnectorsToday, getTopConnectorOfTheDay } from '../getTopConnectors';

describe('getTopConnectors', () => {
  describe('getTop5ConnectorsToday', () => {
    it('should return user in top 5 if the user is in the list of referrals today ', async () => {
      const userId = uuid();
      await mockReferralUsers({ userId });

      const connectors = await getTop5ConnectorsToday(userId);
      const myUserIndex = connectors.findIndex((d) => d.builderId === userId);
      expect(connectors.length).toBe(5);
      expect(myUserIndex).toBeLessThanOrEqual(4);
    });

    it('should not return user in top 5 if the user did not refer anyone today', async () => {
      const userId = uuid();
      await mockReferralUsers();

      const connectors = await getTop5ConnectorsToday(userId);
      const myUser = connectors.find((d) => d.builderId === userId);
      expect(myUser).toBeUndefined();
    });
  });

  describe('getTopConnectorOfTheDay', () => {
    it('should return the top connector of the day', async () => {
      await mockReferralUsers();

      const topConnector = await getTopConnectorOfTheDay();
      expect(topConnector).toBeDefined();
    });
  });
});

export async function mockReferralUsers({ count = 10, userId }: { count?: number; userId?: string } = {}) {
  for (let i = 0; i < count; i++) {
    const referral = await mockScout(userId && i === 0 ? { id: userId } : undefined);

    await prisma.scoutEmailVerification.create({
      data: {
        code: v4(),
        email: referral.email || '',
        scoutId: referral.id,
        completedAt: new Date()
      }
    });

    await updateReferralUsers(referral.id);

    const randomReferee = Math.random() * 10;
    for (let j = 0; j < randomReferee; j++) {
      const referee = await mockScout();
      await createReferralEvent(referral.referralCode || '', referee.id);
      await prisma.scoutEmailVerification.create({
        data: {
          code: v4(),
          email: referee.email || '',
          scoutId: referee.id,
          completedAt: new Date()
        }
      });
      await updateReferralUsers(referee.id);
    }
  }
}
