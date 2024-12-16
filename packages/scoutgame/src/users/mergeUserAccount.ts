import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { v4 } from 'uuid';

import { currentSeason } from '../dates';
import { refreshPointStatsFromHistory } from '../points/refreshPointStatsFromHistory';

export type ProfileToKeep = 'current' | 'new';

export const mergeUserAccount = async ({
  userId,
  farcasterId,
  telegramId,
  selectedProfile
}: {
  userId: string;
  farcasterId?: number | null;
  telegramId?: number | null;
  selectedProfile?: ProfileToKeep | null;
}) => {
  if (!farcasterId && !telegramId) {
    throw new Error('No account identities to merge');
  }

  const secondaryUser = await prisma.scout.findFirstOrThrow({
    where: farcasterId ? { farcasterId } : { telegramId },
    select: {
      builderStatus: true,
      id: true
    }
  });

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
        telegramId: true,
        deletedAt: true,
        builderStatus: true,
        nftPurchaseEvents: {
          where: {
            builderNft: {
              season: currentSeason,
              nftType: 'starter_pack'
            }
          },
          select: {
            id: true
          }
        }
      }
    }),
    prisma.scout.findUniqueOrThrow({
      where: {
        id: mergedUserId
      },
      select: {
        farcasterName: true,
        builderStatus: true,
        walletENS: true,
        avatar: true,
        bio: true,
        displayName: true,
        email: true,
        farcasterId: true,
        telegramId: true,
        deletedAt: true,
        path: true,
        wallets: {
          select: {
            address: true
          }
        },
        nftPurchaseEvents: {
          where: {
            builderNft: {
              season: currentSeason,
              nftType: 'starter_pack'
            }
          },
          select: {
            id: true
          }
        }
      }
    })
  ]);

  const retainedUserStarterPackNft = retainedUser.nftPurchaseEvents.length;
  const mergedUserStarterPackNft = mergedUser.nftPurchaseEvents.length;

  if (retainedUserStarterPackNft + mergedUserStarterPackNft > 3) {
    throw new Error('Can not merge more than 3 starter pack NFTs');
  }

  if (retainedUser.builderStatus !== null && mergedUser.builderStatus !== null) {
    log.error('Can not merge two builder accounts', {
      retainedUserId,
      mergedUserId
    });
    throw new Error('Can not merge two builder accounts');
  }

  if (retainedUserId === mergedUserId) {
    log.error('Can not merge the same account', {
      userId
    });
    throw new Error('Can not merge the same account');
  }

  if (retainedUser.deletedAt || mergedUser.deletedAt) {
    log.error('Can not merge deleted accounts', {
      retainedUserId,
      mergedUserId
    });
    throw new Error('Can not merge deleted accounts');
  }

  // If selected profile is set but one of the account is a builder throw an error
  if (selectedProfile && (mergedUser.builderStatus !== null || retainedUser.builderStatus !== null)) {
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
        updatedUserData.walletENS = retainedUser.walletENS || mergedUser.walletENS;
      }

      // Detach the identities from the merged user
      await tx.scout.update({
        where: {
          id: mergedUserId
        },
        data: {
          farcasterId: null,
          farcasterName: null,
          telegramId: null,
          deletedAt: new Date(),
          // Update the path so that the user is harder to find
          path: `${mergedUser.path}-${v4()}`,
          currentBalance: 0
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

      await tx.builderEvent.updateMany({
        where: {
          builderId: mergedUserId
        },
        data: {
          builderId: retainedUserId
        }
      });
    },
    {
      timeout: 100000
    }
  );

  await refreshPointStatsFromHistory({ userIdOrPath: retainedUserId }).catch((error) => {
    log.error('Could not refresh point stats', {
      error,
      userId: retainedUserId
    });
  });

  await prisma
    .$transaction(
      async (tx) => {
        const nftPurchaseEvents = await tx.nFTPurchaseEvent.findMany({
          where: {
            scoutId: retainedUserId,
            builderNft: {
              season: currentSeason
            }
          },
          select: {
            tokensPurchased: true
          }
        });

        const nftSoldEvents = await tx.nFTPurchaseEvent.findMany({
          where: {
            builderNft: {
              season: currentSeason,
              builderId: retainedUserId
            }
          },
          select: {
            tokensPurchased: true,
            scoutId: true
          }
        });

        await tx.userSeasonStats.update({
          where: {
            userId_season: {
              userId: retainedUserId,
              season: currentSeason
            }
          },
          data: {
            nftsSold: nftSoldEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
            nftsPurchased: nftPurchaseEvents.reduce((acc, event) => acc + event.tokensPurchased, 0),
            nftOwners: arrayUtils.uniqueValues(nftSoldEvents.map((event) => event.scoutId)).length
          }
        });
      },
      {
        timeout: 100000
      }
    )
    .catch((error) => {
      log.error('Could not refresh nft stats', {
        error,
        userId: retainedUserId
      });
    });

  return { retainedUserId, mergedUserId };
};
