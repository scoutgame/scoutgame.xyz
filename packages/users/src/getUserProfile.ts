import { prisma, type BuilderStatus } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { UserProfileData } from '@packages/scoutgame-ui/components/common/Profile/UserProfile';

export type UserProfile = UserProfileData & {
  builderStatus: BuilderStatus | null;
  starterPackNftCount: number;
};

export async function getUserProfile({
  farcasterId,
  telegramId,
  walletAddress
}: {
  farcasterId?: number;
  telegramId?: number;
  walletAddress?: string;
}): Promise<UserProfile | null> {
  if (!farcasterId && !telegramId && !walletAddress) {
    throw new Error('No account identity provided');
  }

  const user = await prisma.scout.findFirst({
    where: farcasterId
      ? { farcasterId }
      : telegramId
        ? { telegramId }
        : { wallets: { some: { address: walletAddress?.toLowerCase() } } },
    select: {
      displayName: true,
      bio: true,
      avatar: true,
      githubUsers: {
        select: {
          login: true
        }
      },
      farcasterName: true,
      builderStatus: true,
      talentProfile: true,
      id: true,
      path: true,
      wallets: {
        select: {
          scoutedNfts: {
            where: {
              builderNft: {
                season: getCurrentSeasonStart(),
                nftType: 'starter_pack'
              }
            },
            select: {
              builderNft: {
                select: {
                  builderId: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar as string,
    githubLogin: user.githubUsers[0]?.login,
    farcasterName: user.farcasterName,
    talentProfile: user.talentProfile,
    id: user.id,
    path: user.path,
    builderStatus: user.builderStatus,
    starterPackNftCount: new Set(
      user.wallets.flatMap((wallet) => wallet.scoutedNfts.map((nft) => nft.builderNft.builderId))
    ).size
  };
}
