import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ProfileToKeep = 'current' | 'new';

export const mergeUserAccount = async ({
  userId,
  farcasterId,
  telegramId,
  selectedProfile
}: {
  userId: string;
  farcasterId?: number;
  telegramId?: number;
  selectedProfile: ProfileToKeep;
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

  const retainedUser = retainedUserId === userId ? primaryUser : secondaryUser;

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
      const updatedUserData: Prisma.ScoutUpdateInput = {
        farcasterId,
        farcasterName: farcasterId ? mergedUser.farcasterName : undefined,
        telegramId
      };

      // Only merge the new profile if none of the users are builders
      if (selectedProfile === 'new' && mergedUser.builderStatus === null && primaryUser.builderStatus === null) {
        updatedUserData.avatar = mergedUser.avatar;
        updatedUserData.displayName = mergedUser.displayName;
        updatedUserData.bio = mergedUser.bio;
        updatedUserData.email = mergedUser.email;
        updatedUserData.walletENS = mergedUser.walletENS;
      }

      // Detach the identities from the merged user
      await tx.scout.update({
        where: {
          id: mergedUserId
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
        data: updatedUserData
      });

      await prisma.scoutWallet.updateMany({
        where: {
          scoutId: mergedUserId
        },
        data: {
          scoutId: retainedUserId
        }
      });

      await tx.scout.update({
        where: { id: mergedUserId },
        data: {
          deletedAt: new Date()
        }
      });

      await tx.scoutMergeEvent.create({
        data: {
          mergedFromId: mergedUserId,
          mergedToId: retainedUserId,
          mergedRecords: {
            farcasterId,
            telegramId
          }
        }
      });

      await tx.nFTPurchaseEvent.updateMany({
        where: {
          scoutId: mergedUserId
        },
        data: {
          scoutId: retainedUserId
        }
      });

      await tx.pointsReceipt.updateMany({
        where: {
          recipientId: mergedUserId
        },
        data: {
          recipientId: retainedUserId
        }
      });

      await tx.pointsReceipt.updateMany({
        where: {
          senderId: mergedUserId
        },
        data: {
          senderId: retainedUserId
        }
      });

      await tx.tokensReceipt.updateMany({
        where: {
          recipientId: mergedUserId
        },
        data: {
          recipientId: retainedUserId
        }
      });

      await tx.tokensReceipt.updateMany({
        where: {
          senderId: mergedUserId
        },
        data: {
          senderId: retainedUserId
        }
      });

      await tx.pendingNftTransaction.updateMany({
        where: {
          userId: mergedUserId
        },
        data: {
          userId: retainedUserId
        }
      });

      await tx.referralCodeEvent.updateMany({
        where: {
          refereeId: mergedUserId
        },
        data: {
          refereeId: retainedUserId
        }
      });

      await tx.talentProfile.updateMany({
        where: {
          builderId: mergedUserId
        },
        data: {
          builderId: retainedUserId
        }
      });

      await tx.scoutGameActivity.updateMany({
        where: {
          userId: mergedUserId
        },
        data: {
          userId: retainedUserId
        }
      });

      // Skipped partner reward events and builder strike records
    },
    {
      timeout: 100000
    }
  );
};
