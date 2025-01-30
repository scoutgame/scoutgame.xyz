import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { completeQuests } from '@packages/scoutgame/quests/completeQuests';
import type { ConnectWaitlistTier } from '@packages/waitlist/scoring/constants';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';
import { generateRandomName } from './generateRandomName';
import { createReferralEvent } from './referrals/createReferralEvent';

export async function findOrCreateFarcasterUser({
  fid,
  newUserId,
  tierOverride,
  referralCode
}: {
  fid: number;
  newUserId?: string;
  tierOverride?: ConnectWaitlistTier;
  referralCode?: string | null;
}): Promise<FindOrCreateUserResult> {
  // check if user already exists to avoid api calls to neynar
  const existing = await prisma.scout.findUnique({
    where: { farcasterId: fid },
    select: {
      id: true,
      onboardedAt: true,
      agreedToTermsAt: true
    }
  });
  if (existing) {
    return { isNew: false, ...existing };
  }
  const profile = await getFarcasterUserById(fid).catch((error) => {
    log.error('Error fetching Farcaster profile', { fid, error });
    return null;
  });
  const displayName = profile?.display_name || generateRandomName();
  const user = await findOrCreateUser({
    newUserId,
    farcasterId: fid,
    avatar: profile?.pfp_url,
    bio: profile?.profile?.bio?.text,
    walletAddresses: profile?.verifications,
    displayName,
    path: profile?.username ?? displayName,
    tierOverride,
    farcasterName: profile?.username
  });

  if (user?.isNew && referralCode) {
    await createReferralEvent(referralCode, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: referralCode, referrerId: user.id });
    });

    await completeQuests(user.id, ['link-farcaster-account']).catch((error) => {
      log.error('Error completing quest: link-farcaster-account', { error, userId: user.id });
    });
  }

  return user;
}
