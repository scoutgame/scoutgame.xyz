import { log } from '@charmverse/core/log';
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
        builderStatus: true,
        deletedAt: true
      }
    }),
    prisma.scout.findFirstOrThrow({
      where: farcasterId ? { farcasterId } : { telegramId },
      select: {
        builderStatus: true,
        id: true,
        deletedAt: true
      }
    })
  ]);

  if (primaryUser.builderStatus !== null && secondaryUser.builderStatus !== null) {
    log.error('Can not merge two builder accounts', {
      primaryUserId: userId,
      secondaryUserId: secondaryUser.id
    });
    throw new Error('Can not merge two builder accounts');
  }

  if (secondaryUser.id === userId) {
    log.error('Can not merge the same account', {
      userId
    });
    throw new Error('Can not merge the same account');
  }

  if (secondaryUser.deletedAt === null || primaryUser.deletedAt === null) {
    log.error('Can not merge deleted accounts', {
      primaryUserId: userId,
      secondaryUserId: secondaryUser.id
    });
    throw new Error('Can not merge deleted accounts');
  }

  // The id of the user to retain
  const retainedUserId = secondaryUser.builderStatus !== null ? secondaryUser.id : userId;

  // The id of the user to merge into the retained user
  // The merged account must not be a builder
  const mergedUserId = secondaryUser.builderStatus === null ? secondaryUser.id : userId;

  const [retainedUser, mergedUser] = await Promise.all([
    prisma.scout.findUniqueOrThrow({
      where: {
        id: retainedUserId
      },
      select: {
        email: true,
        walletENS: true,
        farcasterId: true,
        farcasterName: true,
        telegramId: true
      }
    }),
    prisma.scout.findUniqueOrThrow({
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
        email: true,
        path: true,
        farcasterId: true,
        telegramId: true,
        wallets: {
          select: {
            address: true
          }
        }
      }
    })
  ]);

  // If selected profile is set but one of the account is a builder throw an error
  if (selectedProfile !== null && (mergedUser.builderStatus !== null || primaryUser.builderStatus !== null)) {
    throw new Error('Can not merge builder account profiles');
  }

  await prisma.$transaction(
    async (tx) => {
      const updatedUserData: Prisma.ScoutUpdateInput = {
        farcasterId: retainedUser.farcasterId || mergedUser.farcasterId,
        farcasterName: retainedUser.farcasterName || mergedUser.farcasterName,
        telegramId: retainedUser.telegramId || mergedUser.telegramId
      };

      // If selected profile is set to new, merge the new profile
      if (selectedProfile === 'new') {
        updatedUserData.avatar = mergedUser.avatar;
        updatedUserData.displayName = mergedUser.displayName;
        updatedUserData.bio = mergedUser.bio;
        updatedUserData.email = retainedUser.email || mergedUser.email;
        updatedUserData.walletENS = retainedUser.walletENS || mergedUser.walletENS;
        updatedUserData.path = mergedUser.path;
      }

      // Detach the identities from the merged user
      await tx.scout.update({
        where: {
          id: mergedUserId
        },
        data: {
          email: null,
          farcasterId: null,
          farcasterName: null,
          telegramId: null,
          deletedAt: new Date()
        }
      });

      await tx.scout.update({
        where: { id: retainedUserId },
        data: updatedUserData
      });

      await tx.scoutWallet.updateMany({
        where: {
          scoutId: mergedUserId
        },
        data: {
          scoutId: retainedUserId
        }
      });

      await tx.scoutMergeEvent.create({
        data: {
          mergedFromId: mergedUserId,
          mergedToId: retainedUserId,
          mergedRecords: {
            farcasterId,
            telegramId,
            email: mergedUser.email,
            wallets: mergedUser.wallets.map((wallet) => wallet.address)
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

      // Skipped partner reward events and builder strike records
    },
    {
      timeout: 100000
    }
  );
};
