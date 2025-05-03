import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { v4 } from 'uuid';

export type ProfileToKeep = 'current' | 'new';

export const mergeUserAccount = async ({
  userId,
  farcasterId,
  telegramId,
  selectedProfile,
  walletAddress
}: {
  userId: string;
  farcasterId?: number | null;
  telegramId?: number | null;
  selectedProfile?: ProfileToKeep | null;
  walletAddress?: string;
}) => {
  if (!farcasterId && !telegramId && !walletAddress) {
    throw new Error('No account identities to merge');
  }

  const secondaryUser = await prisma.scout.findFirstOrThrow({
    where: farcasterId
      ? { farcasterId }
      : telegramId
        ? { telegramId }
        : { wallets: { some: { address: { equals: walletAddress?.toLowerCase() } } } },
    select: {
      builderStatus: true,
      id: true
    }
  });

  // The id of the user to merge into the retained user
  // The merged account must not be a builder
  const mergedUserId =
    selectedProfile === 'current'
      ? secondaryUser.id
      : selectedProfile === 'new'
        ? userId
        : secondaryUser.builderStatus === null
          ? secondaryUser.id
          : userId;

  // The id of the user to retain
  const retainedUserId = mergedUserId === secondaryUser.id ? userId : secondaryUser.id;

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
        telegramName: true,
        deletedAt: true,
        builderStatus: true,
        bio: true,
        wallets: {
          select: {
            scoutedNfts: {
              take: 1
            }
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
        telegramName: true,
        deletedAt: true,
        path: true,
        wallets: {
          select: {
            address: true,
            scoutedNfts: {
              take: 1
            }
          }
        }
      }
    })
  ]);

  const retainedUserHasNfts = retainedUser.wallets.some((wallet) => wallet.scoutedNfts.length > 0);
  const mergedUserHasNfts = mergedUser.wallets.some((wallet) => wallet.scoutedNfts.length > 0);

  if (retainedUserHasNfts && mergedUserHasNfts) {
    throw new Error('Can not merge two accounts with NFTs');
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
  // When any of the accounts is a builder selectedProfile should be null
  if (selectedProfile && (mergedUser.builderStatus !== null || retainedUser.builderStatus !== null)) {
    throw new Error('Can not merge builder account profiles');
  }

  await prisma.$transaction(
    async (tx) => {
      const updatedUserData: Prisma.ScoutUpdateInput = {
        farcasterId: retainedUser.farcasterId || mergedUser.farcasterId,
        farcasterName: retainedUser.farcasterName || mergedUser.farcasterName,
        telegramId: retainedUser.telegramId || mergedUser.telegramId,
        telegramName: retainedUser.telegramName || mergedUser.telegramName,
        bio: retainedUser.bio || mergedUser.bio,
        walletENS: retainedUser.walletENS || mergedUser.walletENS
      };

      // Detach the identities from the merged user
      await tx.scout.update({
        where: {
          id: mergedUserId
        },
        data: {
          farcasterId: null,
          farcasterName: null,
          telegramId: null,
          telegramName: null,
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
          scoutId: retainedUserId,
          primary: false
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

      await tx.scoutGameActivity.updateMany({
        where: {
          userId: mergedUserId
        },
        data: {
          userId: retainedUserId
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

  await prisma
    .$transaction(
      async (tx) => {
        const nftsOwned = await tx.scoutNft.findMany({
          where: {
            scoutWallet: {
              scoutId: retainedUserId
            },
            builderNft: {
              season: getCurrentSeasonStart()
            }
          },
          select: {
            balance: true
          }
        });

        const nftsSold = await tx.scoutNft.findMany({
          where: {
            builderNft: {
              season: getCurrentSeasonStart(),
              builderId: retainedUserId
            }
          },
          select: {
            balance: true,
            walletAddress: true
          }
        });

        await tx.userSeasonStats.update({
          where: {
            userId_season: {
              userId: retainedUserId,
              season: getCurrentSeasonStart()
            }
          },
          data: {
            nftsSold: nftsSold.reduce((acc, nft) => acc + nft.balance, 0),
            nftsPurchased: nftsOwned.reduce((acc, nft) => acc + nft.balance, 0),
            nftOwners: arrayUtils.uniqueValues(nftsSold.map((nft) => nft.walletAddress)).length
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
