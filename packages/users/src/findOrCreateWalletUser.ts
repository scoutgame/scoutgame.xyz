import { log } from '@charmverse/core/log';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getENSDetails, getENSName } from '@packages/blockchain/getENSName';
import { getFarcasterUsersByAddresses } from '@packages/farcaster/getFarcasterUsersByAddresses';
import { getAddress } from 'viem';

import { findOrCreateFarcasterUser } from './findOrCreateFarcasterUser';
import { findOrCreateUser } from './findOrCreateUser';
import type { FindOrCreateUserResult } from './findOrCreateUser';
import { generateRandomName } from './generateRandomName';
import { createReferralEvent } from './referrals/createReferralEvent';

export async function findOrCreateWalletUser({
  wallet,
  newUserId,
  referralCode,
  utmCampaign
}: {
  wallet: string;
  newUserId?: string;
  referralCode?: string | null;
  utmCampaign?: string | null;
}): Promise<FindOrCreateUserResult> {
  if (wallet === NULL_EVM_ADDRESS) {
    throw new Error('Cannot create a user for the null wallet address 0x00...00');
  }

  const ens = await getENSName(wallet).catch((error) => {
    log.warn('Could not retrieve ENS while creating a user', { error, wallet });
    return null;
  });
  const ensDetails = await getENSDetails(ens).catch((error) => {
    log.warn('Could not retrieve ENS details while creating a user', { error, wallet });
  });
  const displayName = ens || generateRandomName();
  try {
    const address = getAddress(wallet).toLowerCase();
    const response = await getFarcasterUsersByAddresses({ addresses: [address] });
    const farcasterUser = response[address]?.[0];
    if (farcasterUser) {
      const farcasterId = farcasterUser?.fid;
      const verifications = farcasterUser?.verifications;
      return await findOrCreateFarcasterUser({
        fid: farcasterId,
        newUserId,
        referralCode,
        utmCampaign,
        verifications
      });
    }
  } catch (error) {
    log.warn('Could not retrieve Farcaster user', { error, wallet });
  }

  const user = await findOrCreateUser({
    newUserId,
    walletENS: ens || undefined,
    avatar: ensDetails?.avatar || undefined,
    walletAddresses: [wallet],
    displayName,
    path: displayName,
    utmCampaign: utmCampaign || undefined
  });

  if (user?.isNew && referralCode) {
    await createReferralEvent(referralCode, user.id).catch((error) => {
      // There can be a case where the referrer is not found. Maybe someone will try to guess referral codes to get rewards.
      log.warn('Error creating referral event.', { error, startParam: referralCode, referrerId: user.id });
    });
  }

  return user;
}
