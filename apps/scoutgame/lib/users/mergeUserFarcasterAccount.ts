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
      email: true,
      telegramId: true
    }
  });

  await prisma.$transaction(
    async (tx) => {
      const updatedScoutData: Prisma.ScoutUpdateInput = {
        farcasterId,
        farcasterName: farcasterId ? mergedUser.farcasterName : undefined,
        currentBalance: {
          increment: mergedUser.currentBalance
        },
        telegramId: mergedUser.telegramId
      };

      if (profileToKeep === 'farcaster') {
        updatedScoutData.avatar = mergedUser.avatar;
        updatedScoutData.displayName = mergedUser.displayName;
        updatedScoutData.bio = mergedUser.bio;
        updatedScoutData.email = mergedUser.email;
        updatedScoutData.walletENS = mergedUser.walletENS;
      }

      await tx.scout.update({
        where: {
          id: mergedUser.id
        },
        data: {
          email: null,
          farcasterId: null,
          farcasterName: null,
          telegramId: null
        }
      });

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

      const mergedUserSeasonStats = await tx.userSeasonStats.findUnique({
        where: {
          userId_season: {
            userId: mergedUser.id,
            season: currentSeason
          }
        }
      });

      const pointsEarnedAsBuilder = mergedUserSeasonStats?.pointsEarnedAsBuilder ?? 0;
      const pointsEarnedAsScout = mergedUserSeasonStats?.pointsEarnedAsScout ?? 0;
      const nftOwners = mergedUserSeasonStats?.nftOwners ?? 0;
      const nftsSold = mergedUserSeasonStats?.nftsSold ?? 0;
      const nftsPurchased = mergedUserSeasonStats?.nftsPurchased ?? 0;

      await tx.userSeasonStats.upsert({
        where: {
          userId_season: {
            userId,
            season: currentSeason
          }
        },
        create: {
          userId,
          season: currentSeason,
          pointsEarnedAsBuilder,
          pointsEarnedAsScout,
          nftOwners,
          nftsSold,
          nftsPurchased
        },
        update: {
          pointsEarnedAsBuilder: {
            increment: pointsEarnedAsBuilder
          },
          pointsEarnedAsScout: {
            increment: pointsEarnedAsScout
          },
          nftOwners: {
            increment: nftOwners
          },
          nftsSold: {
            increment: nftsSold
          },
          nftsPurchased: {
            increment: nftsPurchased
          }
        }
      });

      const mergedUserAllTimeStats = await tx.userAllTimeStats.findUnique({
        where: {
          userId: mergedUser.id
        }
      });

      const allTimePointsEarnedAsBuilder = mergedUserAllTimeStats?.pointsEarnedAsBuilder ?? 0;
      const allTimePointsEarnedAsScout = mergedUserAllTimeStats?.pointsEarnedAsScout ?? 0;

      await tx.userAllTimeStats.upsert({
        where: {
          userId
        },
        create: {
          userId,
          pointsEarnedAsBuilder: allTimePointsEarnedAsBuilder,
          pointsEarnedAsScout: allTimePointsEarnedAsScout
        },
        update: {
          pointsEarnedAsBuilder: {
            increment: allTimePointsEarnedAsBuilder
          },
          pointsEarnedAsScout: {
            increment: allTimePointsEarnedAsScout
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

      await tx.talentProfile.updateMany({
        where: {
          builderId: mergedUser.id
        },
        data: {
          builderId: userId
        }
      });

      await tx.partnerRewardEvent.updateMany({
        where: {
          userId: mergedUser.id
        },
        data: {
          userId
        }
      });
    },
    {
      timeout: 100000
    }
  );
};
