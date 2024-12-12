import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';

import { getConnectedUserAccount } from 'lib/users/getUserAccount';

export async function connectFarcasterAccount({ fid, userId }: { fid: number; userId: string }) {
  const existingFarcasterUser = await getConnectedUserAccount({ farcasterId: fid });

  if (existingFarcasterUser) {
    return existingFarcasterUser;
  }

  const profile = await getFarcasterUserById(fid).catch((error) => {
    log.error('Error fetching Farcaster profile', { fid, error });
    return null;
  });

  if (!profile) {
    throw new Error('Error fetching Farcaster profile');
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { farcasterId: fid, farcasterName: profile.username }
  });
}
