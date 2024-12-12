import { prisma, type BuilderStatus } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type UserAccountMetadata = {
  displayName: string;
  farcasterId?: number;
  telegramId?: number;
  walletAddress?: string;
  currentBalance: number;
  nftsPurchased: number;
  avatar: string;
  builderStatus: BuilderStatus | null;
};

export async function getConnectedUserAccount({
  farcasterId,
  telegramId,
  walletAddress
}: {
  farcasterId?: number;
  telegramId?: number;
  walletAddress?: string;
}): Promise<UserAccountMetadata | null> {
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
      farcasterId: true,
      currentBalance: true,
      userSeasonStats: {
        where: {
          season: currentSeason
        },
        select: {
          nftsPurchased: true
        }
      },
      builderStatus: true,
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          imageUrl: true
        }
      },
      avatar: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    displayName: user.displayName,
    currentBalance: user.currentBalance,
    nftsPurchased: user.userSeasonStats[0]?.nftsPurchased ?? 0,
    avatar: user.avatar as string,
    builderStatus: user.builderStatus
  };
}
