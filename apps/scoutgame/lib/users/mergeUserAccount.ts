import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ProfileToKeep = 'current' | 'new';

export const mergeUserAccount = async ({
  userId,
  farcasterId,
  telegramId,
  profileToKeep
}: {
  userId: string;
  farcasterId?: number;
  telegramId?: number;
  profileToKeep: ProfileToKeep;
}) => {
  if (!farcasterId && !telegramId) {
    throw new Error('No account identities to merge');
  }

  const [primaryUser, secondaryUser] = await Promise.all([
    prisma.scout.findUniqueOrThrow({
      where: {
        id: userId
      },
      select: {
        builderStatus: true
      }
    }),
    prisma.scout.findFirstOrThrow({
      where: farcasterId ? { farcasterId } : { telegramId },
      select: {
        builderStatus: true,
        id: true
      }
    })
  ]);

  if (primaryUser.builderStatus !== null && secondaryUser.builderStatus !== null) {
    throw new Error('Can not merge two builder accounts');
  }

  // The id of the user to retain
  const retainedUserId = secondaryUser.builderStatus !== null ? secondaryUser.id : userId;

  // The id of the user to merge into the retained user
  // The merged account must not be a builder
  const mergedUserId = secondaryUser.builderStatus === null ? secondaryUser.id : userId;

  const mergedUser = await prisma.scout.findUniqueOrThrow({
    where: {
      id: mergedUserId
    },
    select: {
      id: true,
      farcasterName: true,
      builderStatus: true,
      walletENS: true,
      avatar: true,
      bio: true,
      displayName: true,
      email: true
    }
  });

  await prisma.$transaction(
    async (tx) => {
      const updatedScoutData: Prisma.ScoutUpdateInput = {
        farcasterId,
        farcasterName: farcasterId ? mergedUser.farcasterName : undefined,
        telegramId
      };

      if (profileToKeep === 'new') {
        updatedScoutData.avatar = mergedUser.avatar;
        updatedScoutData.displayName = mergedUser.displayName;
        updatedScoutData.bio = mergedUser.bio;
        updatedScoutData.email = mergedUser.email;
        updatedScoutData.walletENS = mergedUser.walletENS;
      }

      // Detach the identities from the merged user
      await tx.scout.update({
        where: {
          id: mergedUser.id
        },
        data: {
          email: null,
          farcasterId: farcasterId ? null : undefined,
          farcasterName: farcasterId ? null : undefined,
          telegramId: telegramId ? null : undefined
        }
      });

      await tx.scout.update({
        where: { id: retainedUserId },
        data: updatedScoutData
      });

      await prisma.scoutWallet.updateMany({
        where: {
          scoutId: mergedUser.id
        },
        data: {
          scoutId: retainedUserId
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
          mergedToId: retainedUserId,
          mergedRecords: {
            farcasterId,
            telegramId
          }
        }
      });

      await tx.nFTPurchaseEvent.updateMany({
        where: {
          scoutId: mergedUser.id
        },
        data: {
          scoutId: retainedUserId
        }
      });

      await tx.pointsReceipt.updateMany({
        where: {
          recipientId: mergedUser.id
        },
        data: {
          recipientId: retainedUserId
        }
      });

      await tx.pointsReceipt.updateMany({
        where: {
          senderId: mergedUser.id
        },
        data: {
          senderId: retainedUserId
        }
      });

      await tx.pendingNftTransaction.updateMany({
        where: {
          userId: mergedUser.id
        },
        data: {
          userId: retainedUserId
        }
      });

      await tx.tokensReceipt.updateMany({
        where: {
          recipientId: mergedUser.id
        },
        data: {
          recipientId: retainedUserId
        }
      });

      await tx.referralCodeEvent.updateMany({
        where: {
          refereeId: mergedUser.id
        },
        data: {
          refereeId: retainedUserId
        }
      });

      await tx.talentProfile.updateMany({
        where: {
          builderId: mergedUser.id
        },
        data: {
          builderId: retainedUserId
        }
      });

      // Skipped partner reward events and builder strike records
    },
    {
      timeout: 100000
    }
  );
};
