import { prisma } from '@charmverse/core/prisma-client';

import { referralBonusPoints } from '../../constants';
import { mockScout } from '../../testing/database';
import { createReferralBonusEvent } from '../createReferralBonusEvent';
import { createReferralEvent } from '../createReferralEvent';
import { updateReferralUsers } from '../updateReferralUsers';

describe('createReferralBonusEvent', () => {
  it('should throw an error if the referrer is not found', async () => {
    const referee = await mockScout();
    await expect(createReferralBonusEvent(referee.id)).rejects.toThrow('Referrer not found');
  });

  it('should throw an error if the referee already has a referral bonus event', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();
    await createReferralEvent(referrer.referralCode, referee.id);
    await updateReferralUsers(referee.id);
    await createReferralBonusEvent(referee.id);
    await expect(createReferralBonusEvent(referee.id)).rejects.toThrow('Referral bonus event already exists');
  });

  it('should create a referral bonus event and points receipt', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();

    await createReferralEvent(referrer.referralCode, referee.id);
    await updateReferralUsers(referee.id);

    await createReferralBonusEvent(referee.id);

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        type: 'referral_bonus',
        builderId: referrer.id
      },
      select: {
        referralBonusEvent: true,
        id: true
      }
    });

    const pointsReceipt = await prisma.pointsReceipt.findFirstOrThrow({
      where: {
        recipientId: referrer.id,
        event: {
          id: builderEvent.id
        }
      },
      select: {
        value: true
      }
    });

    expect(builderEvent).not.toBeNull();
    expect(builderEvent.referralBonusEvent).not.toBeNull();
    expect(pointsReceipt).not.toBeNull();
    expect(pointsReceipt.value).toBe(referralBonusPoints);
  });
});
