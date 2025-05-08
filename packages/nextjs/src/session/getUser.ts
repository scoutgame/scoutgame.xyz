import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
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
      utmCampaign: true,
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

  const { wallets, ...rest } = user;

  return {
    ...rest,
    primaryWallet: wallets[0]?.address
  };
}

export const cacheGetUser = cache(getUser);
