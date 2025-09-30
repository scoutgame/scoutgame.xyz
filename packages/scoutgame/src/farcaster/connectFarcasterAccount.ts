import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { getUserProfile } from '@packages/users/getUserProfile';

export async function connectFarcasterAccount({ fid, userId }: { fid: number; userId: string }) {
  const connectedUser = await getUserProfile({ farcasterId: fid });

  if (connectedUser) {
    if (connectedUser.id === userId) {
      log.debug('Farcaster account already connected to this user', { userId, fid });
      return {};
    }
    return { connectedUser };
  }

  const profile = await getFarcasterUserById(fid).catch((error) => {
    log.error('Error fetching Farcaster profile', { userId, fid, error });
    return null;
  });

  if (!profile) {
    throw new Error('Error fetching Farcaster profile');
  }

  await prisma.scout.update({
    where: { id: userId },
    data: { farcasterId: fid, farcasterName: profile.username }
  });

  return {};
}
