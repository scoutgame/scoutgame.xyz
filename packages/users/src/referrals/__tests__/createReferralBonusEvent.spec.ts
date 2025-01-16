import { prisma } from '@charmverse/core/prisma-client';
import { mockScout } from '@packages/testing/database';
import { v4 } from 'uuid';

import { referralBonusPoints } from '../../constants';
import { createReferralBonusEvent } from '../createReferralBonusEvent';
import { createReferralEvent } from '../createReferralEvent';
import { updateReferralUsers } from '../updateReferralUsers';

describe('createReferralBonusEvent', () => {
  it('should throw an error if the referee already has a referral bonus event', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();

    await prisma.scoutEmailVerification.create({
      data: {
        scoutId: referee.id,
        completedAt: new Date(),
        email: 'test@test.com',
        code: v4()
      }
    });

    await createReferralEvent(referrer.referralCode, referee.id);
    await updateReferralUsers(referee.id);
    await createReferralBonusEvent(referee.id);
    const result = await createReferralBonusEvent(referee.id);
    expect(result.result).toBe('already_referred');
  });

  it('should not create a referral bonus event if the referrer is deleted', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();
    await createReferralEvent(referrer.referralCode, referee.id);
    await updateReferralUsers(referee.id);

    await prisma.scout.update({
      where: { id: referrer.id },
      data: { deletedAt: new Date() }
    });

    const result = await createReferralBonusEvent(referee.id);
    expect(result.result).toBe('referrer_deleted');
  });

  it('should not create a referral bonus event if the referee has not verified their email', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();
    await createReferralEvent(referrer.referralCode, referee.id);
    await updateReferralUsers(referee.id);
    const result = await createReferralBonusEvent(referee.id);
    expect(result.result).toBe('referee_not_verified');
  });

  it('should throw an error if the referrer is not found', async () => {
    const referee = await mockScout();
    const result = await createReferralBonusEvent(referee.id);
    expect(result.result).toBe('referrer_not_found');
  });

  it('should create a referral bonus event and points receipt if the referee has verified their email', async () => {
    const referrer = await mockScout();
    const referee = await mockScout();

    await prisma.scoutEmailVerification.create({
      data: {
        scoutId: referee.id,
        completedAt: new Date(),
        email: 'test@test.com',
        code: v4()
      }
    });

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
