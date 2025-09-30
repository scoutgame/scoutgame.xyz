import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import type { ConnectWaitlistTier } from '@packages/waitlist/scoring/constants';

import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';
import { generateRandomName } from './generateRandomName';

export async function findOrCreateFarcasterUser({
  fid,
  newUserId,
  tierOverride,
  referralCode,
  utmCampaign,
  verifications
}: {
  fid: number;
  newUserId?: string;
  tierOverride?: ConnectWaitlistTier;
  referralCode?: string | null;
  utmCampaign?: string | null;
  verifications?: string[];
}): Promise<FindOrCreateUserResult> {
  // check if user already exists to avoid api calls to neynar
  const existing = await prisma.scout.findUnique({
    where: { farcasterId: fid },
    select: {
      id: true,
      onboardedAt: true,
      agreedToTermsAt: true,
      wallets: {
        select: {
          address: true
        }
      }
    }
  });
  if (existing) {
    const scoutWalletAddresses = existing.wallets.map((w) => w.address.toLowerCase()) ?? [];
    const newAddresses = verifications?.filter((address) => !scoutWalletAddresses.includes(address)) ?? [];
    if (newAddresses.length) {
      await prisma.scout.update({
        where: { id: existing.id },
        data: { wallets: { create: newAddresses.map((address) => ({ address })) } }
      });
    }
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
    farcasterName: profile?.username,
    utmCampaign: utmCampaign || undefined
  });

  return user;
}
