import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getCurrentWeek, getWeekFromDate } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
import type { Address } from 'viem';

import { sendNotifications } from '../notifications/sendNotifications';
import { scoutTokenDecimals } from '../protocol/constants';

import { builderTokenDecimals } from './constants';
import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';
import { refreshEstimatedPayouts } from './refreshEstimatedPayouts';
import { refreshScoutNftBalance } from './refreshScoutNftBalance';

export async function recordOnchainNftMint({
  builderNftId,
  recipientAddress,
  scoutId,
  amount,
  pointsValue,
  sentAt = new Date(),
  txLogIndex,
  txHash
}: {
  builderNftId: string;
  recipientAddress: Address;
  scoutId: string;
  amount: number;
  pointsValue: number;
  sentAt?: Date;
  txLogIndex: number;
  txHash: string;
}) {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    },
    select: {
      contractAddress: true,
      nftType: true,
      tokenId: true,
      builderId: true,
      season: true,
      currentPriceInScoutToken: true,
      imageUrl: true,
      builder: {
        select: {
          displayName: true,
          path: true
        }
      }
    }
  });

  const [builderNftScouts, scoutNfts] = await Promise.all([
    prisma.scoutNft.findMany({
      where: {
        builderNft: {
          builderId: builderNft.builderId,
          season: builderNft.season
        }
      },
      select: {
        balance: true,
        scoutWallet: {
          select: {
            scoutId: true
          }
        }
      }
    }),
    prisma.scoutNft.findMany({
      where: {
        builderNft: {
          season: builderNft.season
        },
        scoutWallet: {
          scoutId
        }
      },
      select: {
        balance: true
      }
    })
  ]);

  await refreshBuilderNftPrice({
    season: builderNft.season,
    builderId: builderNft.builderId
  });

  const uniqueOwners: Set<string> = new Set();
  let nftsSold = 0;
  let nftsPurchased = 0;

  const week = getWeekFromDate(sentAt);

  builderNftScouts.forEach((scout) => {
    if (scout.scoutWallet?.scoutId) {
      uniqueOwners.add(scout.scoutWallet.scoutId);
    }
    nftsSold += scout.balance;
  });

  scoutNfts.forEach((scout) => {
    nftsPurchased += scout.balance;
  });

  const { balance } = await prisma.$transaction(async (tx) => {
    const _balance = await refreshScoutNftBalance({
      contractAddress: builderNft.contractAddress as Address,
      nftType: builderNft.nftType,
      tokenId: builderNft.tokenId,
      wallet: recipientAddress.toLowerCase() as Address
    });

    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: builderNft.builderId,
          season: builderNft.season
        }
      },
      update: {
        nftOwners: uniqueOwners.size,
        nftsSold
      },
      create: {
        nftOwners: uniqueOwners.size,
        nftsSold,
        userId: builderNft.builderId,
        season: builderNft.season
      }
    });

    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: scoutId,
          season: builderNft.season
        }
      },
      update: {
        nftsPurchased
      },
      create: {
        nftsPurchased,
        userId: scoutId,
        season: builderNft.season
      }
    });

    await tx.builderEvent.create({
      data: {
        type: 'nft_purchase',
        season: builderNft.season,
        week,
        builder: {
          connect: {
            id: builderNft.builderId
          }
        },
        createdAt: sentAt,
        nftPurchaseEvent: {
          create: {
            pointsValue,
            tokensPurchased: amount,
            createdAt: sentAt,
            txHash: txHash.toLowerCase(),
            builderNftId,
            walletAddress: recipientAddress,
            senderWalletAddress: null,
            txLogIndex
          }
        }
      }
    });

    return { balance: _balance };
  });

  await refreshEstimatedPayouts({
    week: getCurrentWeek(),
    builderIdToRefresh: builderNft.builderId
  }).catch((error) => {
    log.error('Error refreshing estimated payouts', {
      error,
      builderId: builderNft.builderId,
      userId: scoutId,
      week: getCurrentWeek()
    });
  });

  if (builderNft.nftType === 'default') {
    try {
      const [scout, nft] = await Promise.all([
        prisma.scout.findUniqueOrThrow({
          where: {
            id: scoutId
          },
          select: {
            displayName: true,
            path: true
          }
        }),
        prisma.builderNft.findUniqueOrThrow({
          where: {
            id: builderNftId
          },
          select: {
            currentPrice: true,
            currentPriceInScoutToken: true
          }
        })
      ]);
      const currentCardPrice = isOnchainPlatform()
        ? (Number(nft.currentPriceInScoutToken || 0) / 10 ** scoutTokenDecimals).toFixed(2)
        : (Number(nft.currentPrice || 0) / 10 ** builderTokenDecimals).toFixed(2);

      await sendNotifications({
        notificationType: 'builder_card_scouted',
        userId: builderNft.builderId,
        email: {
          templateVariables: {
            builder_name: builderNft.builder.displayName,
            builder_profile_link: `https://scoutgame.xyz/u/${builderNft.builder.path}`,
            cards_purchased: amount,
            total_purchase_cost: pointsValue,
            builder_card_image: builderNft.imageUrl,
            scout_name: scout.displayName,
            scout_profile_link: `https://scoutgame.xyz/u/${scout.path}`,
            current_card_price: currentCardPrice
          }
        },
        farcaster: {
          templateVariables: {
            scouterName: scout.displayName,
            scouterPath: scout.path
          }
        }
      });
    } catch (error) {
      log.error('Error sending builder card scouted email', {
        error,
        builderId: builderNft.builderId,
        userId: scoutId
      });
    }
  }

  return { balance, uniqueOwners };
}
