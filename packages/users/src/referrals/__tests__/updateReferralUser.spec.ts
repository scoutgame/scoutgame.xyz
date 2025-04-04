import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockScout, mockScoutedNft, mockNFTPurchaseEvent } from '@packages/testing/database';

import { createVerificationCode, verifyEmail } from '../../verifyEmail';
import { createReferralEvent } from '../createReferralEvent';
import { updateReferralUsers } from '../updateReferralUsers';

describe('updateReferralUsers', () => {
  it('should create a referral event with a valid referral code', async () => {
    const referral = await mockScout();
    const referee = await mockScout({ verifiedEmail: true });
    await createReferralEvent(referral.referralCode, referee.id);
    // const result = await updateReferralUsers(referee.id);

    // expect(result.result).toBe('success');

    const event = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        builderEvent: {
          builderId: referral.id
        },
        refereeId: referee.id
      }
    });

    expect(!!event?.id).toBeTruthy();
    expect(!!event?.completedAt).not.toBeTruthy();
  });

  it('should require an NFT purchase to be eligible for referral', async () => {
    const referral = await mockBuilder({ createNft: true });
    const referee = await mockScout({ verifiedEmail: true });
    await createReferralEvent(referral.referralCode, referee.id);
    const result = await updateReferralUsers(referee.id);

    expect(result.result).toBe('no_nft_purchase');

    await mockScoutedNft({
      builderId: referral.id,
      scoutId: referee.id
    });
    await mockNFTPurchaseEvent({
      builderId: referral.id,
      scoutId: referee.id,
      nftType: 'default'
    });

    expect((await updateReferralUsers(referee.id)).result).toBe('success');

    const event = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        builderEvent: {
          builderId: referral.id
        },
        refereeId: referee.id
      }
    });

    expect(!!event?.completedAt).toBeTruthy();
  });

  it('should not give credit if referee has not verified their email', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referee = await mockScout({ builderId: referrer.id, currentBalance: 0 });

    await createReferralEvent(referrer.referralCode, referee.id);

    const result = await updateReferralUsers(referee.id);

    expect(result.result).toBe('not_verified');
  });

  it('should not give credit if referee has already been referred', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referrer2 = await mockScout({ builderId: referrer.id });
    const referee = await mockScout({ builderId: referrer.id, verifiedEmail: true });

    await createReferralEvent(referrer.referralCode, referee.id);
    await createReferralEvent(referrer2.referralCode, referee.id);

    const result = await updateReferralUsers(referee.id);
    expect(result.result).toBe('success');

    const result2 = await updateReferralUsers(referee.id);
    expect(result2.result).toBe('already_referred');
  });

  it('should not give credit if referee has not been referred', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referee = await mockScout({ builderId: referrer.id });

    const result = await updateReferralUsers(referee.id);
    expect(result.result).toBe('not_referred');
  });

  it('should not give credit if referee has an email similar to another referee', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referee = await mockScout({ builderId: referrer.id, email: 'matteo@gmail.com', verifiedEmail: true });
    const referee2 = await mockScout({ builderId: referrer.id, email: 'matteo+test@gmail.com', verifiedEmail: true });
    const referee3 = await mockScout({ builderId: referrer.id, email: 'Matteo@gmail.com', verifiedEmail: true });
    // create a case that should pass even though it starts with the same username "matt"
    const referee4 = await mockScout({ builderId: referrer.id, email: 'matteosplace@gmail.com', verifiedEmail: true });

    await createReferralEvent(referrer.referralCode, referee.id);

    const result = await updateReferralUsers(referee.id);
    expect(result.result).toBe('success');

    await createReferralEvent(referrer.referralCode, referee2.id);
    const result2 = await updateReferralUsers(referee2.id);
    expect(result2.result).toBe('already_referred_as_another_user');

    await createReferralEvent(referrer.referralCode, referee3.id);
    const result3 = await updateReferralUsers(referee3.id);
    expect(result3.result).toBe('already_referred_as_another_user');

    await createReferralEvent(referrer.referralCode, referee4.id);
    const result4 = await updateReferralUsers(referee4.id);
    expect(result4.result).toBe('success');
  });

  it('should not give credit if referee has an email similar to another referee using + hack', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referee = await mockScout({ builderId: referrer.id, email: 'jamesmith+test@gmail.com', verifiedEmail: true });
    const referee2 = await mockScout({
      builderId: referrer.id,
      email: 'jamesmith+test2@gmail.com',
      verifiedEmail: true
    });

    await createReferralEvent(referrer.referralCode, referee.id);

    const result = await updateReferralUsers(referee.id);
    expect(result.result).toBe('success');

    await createReferralEvent(referrer.referralCode, referee2.id);
    const result2 = await updateReferralUsers(referee2.id);
    expect(result2.result).toBe('already_referred_as_another_user');
  });

  it('should be triggered when a referee verifies their email', async () => {
    const referrer = await mockBuilder({ createNft: true });
    const referee = await mockScout({ builderId: referrer.id });

    await createReferralEvent(referrer.referralCode, referee.id);

    const code = await createVerificationCode({ email: referee.email!, userId: referee.id });
    await verifyEmail(code);

    const event = await prisma.referralCodeEvent.findFirstOrThrow({
      where: {
        refereeId: referee.id
      }
    });
    expect(event.completedAt).toBeTruthy();
  });
});
