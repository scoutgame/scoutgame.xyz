import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export const mergeUserFarcasterAccount = async ({
  userId: _userId,
  farcasterId,
  profileToKeep
}: {
  userId: string;
  farcasterId: number;
  profileToKeep: 'current' | 'farcaster';
}) => {
  const [primaryUser, secondaryUser] = await Promise.all([
    prisma.scout.findUniqueOrThrow({
      where: {
        id: _userId
      },
      select: {
        builderStatus: true
      }
    }),
    prisma.scout.findFirstOrThrow({
      where: {
        farcasterId
      },
      select: {
        builderStatus: true,
        id: true
      }
    })
  ]);

  if (primaryUser.builderStatus !== null && secondaryUser.builderStatus !== null) {
    throw new Error('Can not merge two builder accounts');
  }

  // The user to merge is the one that is not a builder
  const mergedUser = await prisma.scout.findUniqueOrThrow({
    where:
      secondaryUser.builderStatus === null
        ? {
            farcasterId
          }
        : {
            id: _userId
          },
    select: {
      id: true,
      farcasterName: true,
      walletENS: true,
      avatar: true,
      bio: true,
      displayName: true,
      email: true
    }
  });

  // The id of the user to retain
  const userId = secondaryUser.builderStatus !== null ? secondaryUser.id : _userId;

  await prisma.$transaction(
    async (tx) => {
      const updatedScoutData: Prisma.ScoutUpdateInput = {
        farcasterId,
        farcasterName: farcasterId ? mergedUser.farcasterName : undefined
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
          farcasterName: null
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

      await tx.pointsReceipt.updateMany({
        where: {
          senderId: mergedUser.id
        },
        data: {
          senderId: userId
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

      // Skipped partner reward events records
    },
    {
      timeout: 100000
    }
  );
};
