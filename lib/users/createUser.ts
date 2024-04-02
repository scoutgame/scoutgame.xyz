import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { getENSName } from 'lib/blockchain/getENSName';
import type { SignupAnalytics } from 'lib/metrics/mixpanel/interfaces/UserEvent';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';
import { sessionUserRelations } from 'lib/session/config';
import { postUserCreate } from 'lib/users/postUserCreate';
import { shortWalletAddress } from 'lib/utils/blockchain';
import { uid } from 'lib/utils/strings';
import type { LoggedInUser } from 'models';

import { getUserProfile } from './getUser';
import { prepopulateUserProfile } from './prepopulateUserProfile';

type UserProps = { address: string; email?: string; id?: string; avatar?: string; skipTracking?: boolean };

export async function createOrGetUserFromWallet(
  { id = v4(), address, email, avatar, skipTracking }: UserProps,
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<{
  user: LoggedInUser;
  isNew: boolean;
}> {
  const lowercaseAddress = address.toLowerCase();

  let newlySignedUser: LoggedInUser | undefined;

  let existingUser: {
    user: LoggedInUser;
    isNew: boolean;
  };

  try {
    const user = await getUserProfile('addresses', lowercaseAddress);
    existingUser = {
      isNew: false,
      user
    };

    if (user.claimed === false) {
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          claimed: true,
          email,
          avatar
        }
      });
      newlySignedUser = user;
      existingUser.isNew = true;
    }
  } catch (_) {
    // ignore error, it just means user was not found
    let ens: string | null = null;
    try {
      ens = await getENSName(address);
    } catch (error) {
      log.warn('Could not retrieve ENS while creating a user', { error });
    }
    const userPath = shortWalletAddress(address).replace('…', '-');
    const isUserPathAvailable = await isProfilePathAvailable(userPath);

    const newUser = await prisma.user.create({
      data: {
        avatar,
        email,
        id,
        identityType: 'Wallet',
        username: ens ?? shortWalletAddress(lowercaseAddress),
        path: isUserPathAvailable ? userPath : uid(),
        wallets: {
          create: {
            address: lowercaseAddress,
            ensname: ens
          }
        }
      },
      include: sessionUserRelations
    });

    existingUser = {
      isNew: true,
      user: newUser
    };

    newlySignedUser = newUser;
  }

  if (newlySignedUser) {
    const ens = await getENSName(address);
    try {
      await prepopulateUserProfile(newlySignedUser, ens);
    } catch (error) {
      log.error('Error while prepopulating user profile', { error, userId: newlySignedUser.id });
    }

    if (newlySignedUser.identityType === 'Wallet') {
      logSignupViaWallet();
    }

    if (!skipTracking && newlySignedUser.identityType) {
      postUserCreate({ user: newlySignedUser, identityType: newlySignedUser.identityType, signupAnalytics });
    }
  }

  return existingUser;
}

export async function createUserFromWallet(
  { id = v4(), address, email, avatar, skipTracking }: UserProps,
  signupAnalytics: Partial<SignupAnalytics> = {}
): Promise<LoggedInUser> {
  const { user } = await createOrGetUserFromWallet({ id, address, email, avatar, skipTracking }, signupAnalytics);
  return user;
}
