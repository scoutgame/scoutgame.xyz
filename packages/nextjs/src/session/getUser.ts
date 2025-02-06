import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@packages/utils/url';
import { cache } from 'react';

import type { SessionUser } from './interfaces';

export async function getUser(userId?: string): Promise<SessionUser | null> {
  if (!userId) {
    return null;
  }

  const user = await prisma.scout.findFirst({
    where: {
      id: userId
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      builderStatus: true,
      currentBalance: true,
      onboardedAt: true,
      agreedToTermsAt: true,
      farcasterId: true,
      farcasterName: true,
      bio: true,
      referralCode: true,
      deletedAt: true,
      wallets: {
        where: {
          primary: true
        },
        select: {
          address: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  if (user?.avatar) {
    user.avatar = replaceS3Domain(user.avatar);
  }

  return {
    ...user,
    primaryWalletAddress: user?.wallets[0]?.address as string
  };
}

export const cacheGetUser = cache(getUser);
