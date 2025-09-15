import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { findOrCreateFarcasterUser } from '@packages/users/findOrCreateFarcasterUser';

import type { SearchUserResult } from './searchForUser';

export async function createUser({ scout, farcasterUser }: SearchUserResult): Promise<Scout> {
  if (scout) {
    throw new Error('Scout user already exists');
  }
  if (!scout && !farcasterUser) {
    throw new Error('No input data provided to create a user');
  }

  // convert existing waitlist record to scout
  if (farcasterUser) {
    const result = await findOrCreateFarcasterUser({ fid: farcasterUser.fid });
    const newScout = await prisma.scout.findUniqueOrThrow({
      where: {
        id: result.id
      }
    });
    return newScout;
  }
  throw new Error('Unknown scenario when creating user');
}
