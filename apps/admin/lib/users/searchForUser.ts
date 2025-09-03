import type { ConnectWaitlistSlot, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { getFarcasterUserByUsername } from '@packages/farcaster/getFarcasterUserByUsername';
import type { FarcasterUser } from '@packages/farcaster/interfaces';

import { getNumberFromString } from './getUsers';

export type SearchUserResult = {
  scout?: Scout & { githubLogin?: string };
  farcasterUser?: FarcasterUser;
};

// find a single user, from scouts or waitlist record. Eventually this doesnt need to search waitlist
export async function searchForUser({ searchString }: { searchString: string }): Promise<SearchUserResult | null> {
  if (searchString.length < 2) {
    return null;
  }
  // assume farcaster id if search string is a number
  // look for scout, then waitlist, then farcaster for a profile
  const userFid = getNumberFromString(searchString);
  if (userFid) {
    const scout = await prisma.scout.findUnique({
      where: {
        farcasterId: userFid,
        deletedAt: null
      }
    });
    if (scout) {
      return { scout };
    }
    const farcasterUser = await getFarcasterUserById(userFid);
    if (farcasterUser) {
      return { farcasterUser };
    }
  }
  // check for scout by path
  const user = await prisma.scout.findUnique({
    where: {
      path: searchString
    },
    include: {
      githubUsers: true
    }
  });
  if (user) {
    return { scout: { ...user, githubLogin: user.githubUsers[0]?.login } };
  }
  // check for scout by name
  const userByName = await prisma.scout.findFirst({
    where: {
      displayName: {
        equals: searchString,
        mode: 'insensitive'
      }
    },
    include: {
      githubUsers: true
    }
  });
  if (userByName) {
    return { scout: { ...userByName, githubLogin: userByName.githubUsers[0]?.login } };
  }
  // check for waitlist by github login or farcaster username
  const farcasterUser = await getFarcasterUserByUsername(searchString);
  if (farcasterUser) {
    return { farcasterUser };
  }

  return null;
}
