import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export const mergeUserFarcasterAccount = async ({
  userId,
  farcasterId,
  profileToKeep
}: {
  userId: string;
  farcasterId: number;
  profileToKeep: 'current' | 'farcaster';
}) => {
  const mergedUser = await prisma.scout.findFirstOrThrow({
    where: {
      farcasterId
    },
    select: {
      id: true,
      currentBalance: true,
      farcasterName: true,
      walletENS: true,
      wallets: true,
      avatar: true,
      bio: true,
      displayName: true,
      path: true,
      email: true
    }
  });

  await prisma.$transaction(async (tx) => {
    const updatedScoutData: Prisma.ScoutUpdateInput = {
      farcasterId,
      farcasterName: farcasterId ? mergedUser.farcasterName : undefined,
      currentBalance: {
        increment: mergedUser.currentBalance
      }
    };

    if (profileToKeep === 'farcaster') {
      updatedScoutData.avatar = mergedUser.avatar;
      updatedScoutData.displayName = mergedUser.displayName;
      updatedScoutData.bio = mergedUser.bio;
      updatedScoutData.path = mergedUser.path;
      updatedScoutData.email = mergedUser.email;
      updatedScoutData.walletENS = mergedUser.walletENS;
    }

    await tx.scout.update({
      where: { id: userId },
      data: updatedScoutData
    });

    await prisma.scoutWallet.updateMany({
      where: {
        scoutId: mergedUser.id
      },
      data: {
        scoutId: userId
      }
    });

    await tx.scout.update({
      where: { id: mergedUser.id },
      data: {
        deletedAt: new Date()
      }
    });

    await tx.scoutMergeEvent.create({
      data: {
        mergedFromId: mergedUser.id,
        mergedToId: userId,
        mergedRecords: {
          farcasterId
        }
      }
    });

    await tx.nFTPurchaseEvent.updateMany({
      where: {
        scoutId: mergedUser.id
      },
      data: {
        scoutId: userId
      }
    });

    await tx.pointsReceipt.updateMany({
      where: {
        recipientId: mergedUser.id
      },
      data: {
        recipientId: userId
      }
    });

    await tx.userWeeklyStats.deleteMany({
      where: {
        userId: mergedUser.id
      }
    });

    const mergedUserSeasonStats = await tx.userSeasonStats.findFirstOrThrow({
      where: {
        userId: mergedUser.id,
        season: currentSeason
      }
    });

    await tx.userSeasonStats.update({
      where: {
        userId_season: {
          userId,
          season: currentSeason
        }
      },
      data: {
        pointsEarnedAsBuilder: {
          increment: mergedUserSeasonStats.pointsEarnedAsBuilder
        },
        pointsEarnedAsScout: {
          increment: mergedUserSeasonStats.pointsEarnedAsScout
        },
        nftOwners: {
          increment: mergedUserSeasonStats.nftOwners ?? 0
        },
        nftsSold: {
          increment: mergedUserSeasonStats.nftsSold ?? 0
        },
        nftsPurchased: {
          increment: mergedUserSeasonStats.nftsPurchased
        }
      }
    });

    const mergedUserAllTimeStats = await tx.userAllTimeStats.findFirstOrThrow({
      where: {
        userId: mergedUser.id
      }
    });

    await tx.userAllTimeStats.update({
      where: {
        userId
      },
      data: {
        pointsEarnedAsBuilder: {
          increment: mergedUserAllTimeStats.pointsEarnedAsBuilder
        },
        pointsEarnedAsScout: {
          increment: mergedUserAllTimeStats.pointsEarnedAsScout
        }
      }
    });

    await tx.pendingNftTransaction.updateMany({
      where: {
        userId: mergedUser.id
      },
      data: {
        userId
      }
    });

    await tx.tokensReceipt.updateMany({
      where: {
        recipientId: mergedUser.id
      },
      data: {
        recipientId: userId
      }
    });

    await tx.referralCodeEvent.updateMany({
      where: {
        refereeId: mergedUser.id
      },
      data: {
        refereeId: userId
      }
    });

    // Skipping social claim and daily claim events, partner reward events and talent profile
  });
};
