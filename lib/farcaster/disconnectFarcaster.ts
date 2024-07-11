import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/models';

import { getUserProfile } from 'lib/users/getUser';
import { InvalidInputError } from 'lib/utils/errors';

export async function disconnectFarcaster({ userId }: { userId: string }): Promise<LoggedInUser> {
  const farcasterUser = await prisma.farcasterUser.findUnique({
    where: {
      userId
    }
  });

  if (!farcasterUser) {
    throw new InvalidInputError('Farcaster account was not found');
  }

  await prisma.farcasterUser.delete({
    where: {
      fid: farcasterUser.fid
    }
  });

  return getUserProfile('id', userId);
}
