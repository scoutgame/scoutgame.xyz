import { prisma } from '@charmverse/core/prisma-client';
import { findOrCreateFarcasterUser } from '@packages/users/findOrCreateFarcasterUser';
import { isProdEnv } from '@packages/utils/constants';

export const whitelistedFids: number[] = [
  472, 4339, 1212, 318061, 10921, 828888,
  // matt
  4356,
  // drea
  814997
];
export async function getAdminUser({ fid }: { fid: number }) {
  if (!whitelistedFids.includes(fid)) {
    return null;
  }

  const user = await findOrCreateFarcasterUser({ fid });

  return user;
}
