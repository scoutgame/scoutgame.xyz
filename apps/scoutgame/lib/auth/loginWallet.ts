import { InvalidInputError } from '@charmverse/core/errors';
import { SiweMessage } from 'siwe';

import { findOrCreateUserWallet } from '../user/findOrCreateUserWallet';

import type { LoggedInUser } from './interfaces';
import type { LoginWalletSchema } from './loginUserSchema';

export async function verifyWalletSignature({ message, signature }: LoginWalletSchema) {
  if (!message || !signature) {
    throw new InvalidInputError('Message and signature are required');
  }

  try {
    const siweMessage = new SiweMessage(message);
    const verifiedMessage = await siweMessage.verify({ signature });

    if (verifiedMessage?.error || !verifiedMessage.success || !verifiedMessage.data?.address) {
      return null;
    } else {
      return verifiedMessage.data;
    }
  } catch (err: any) {
    return null;
  }
}

export async function loginWallet({
  wallet,
  newUserId
}: {
  wallet: LoginWalletSchema;
  newUserId?: string;
}): Promise<LoggedInUser> {
  const walletData = await verifyWalletSignature(wallet);

  if (!walletData) {
    throw new InvalidInputError('Invalid wallet signature');
  }

  const user = await findOrCreateUserWallet({ newUserId, walletData });

  return user;
}