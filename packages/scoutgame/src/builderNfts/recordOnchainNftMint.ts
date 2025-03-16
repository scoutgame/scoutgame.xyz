import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
import type { Address } from 'viem';

import { sendNotifications } from '../notifications/sendNotifications';
import { scoutTokenDecimals } from '../protocol/constants';
import { recordNftPurchaseQuests } from '../quests/recordNftPurchaseQuests';

import { builderTokenDecimals } from './constants';
import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';
import { refreshEstimatedPayouts } from './refreshEstimatedPayouts';
import { refreshScoutNftBalance } from './refreshScoutNftBalance';

export async function recordOnchainNftMint({
  builderNftId,
  senderAddress,
  scoutId,
  amount,
  pointsValue
}: {
  builderNftId: string;
  senderAddress: `0x${string}`;
  scoutId: string;
  amount: number;
  pointsValue: number;
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

  await refreshBuilderNftPrice({
    season: builderNft.season,
    builderId: builderNft.builderId
  });

  const scoutNfts = await prisma.scoutNft.findMany({
    where: {
      builderNftId
    },
    select: {
      balance: true,
      scoutWallet: {
        select: {
          scoutId: true
        }
      }
    }
  });

  const uniqueOwners: Set<string> = new Set();
  let nftsSold = 0;

  scoutNfts.forEach((scoutNft) => {
    if (scoutNft.scoutWallet?.scoutId) {
      uniqueOwners.add(scoutNft.scoutWallet.scoutId);
    }
    nftsSold += scoutNft.balance;
  });

  const { balance } = await prisma.$transaction(async (tx) => {
    const _balance = await refreshScoutNftBalance({
      contractAddress: builderNft.contractAddress as Address,
      nftType: builderNft.nftType,
      tokenId: builderNft.tokenId,
      wallet: senderAddress.toLowerCase() as `0x${string}`
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
        nftsSold: {
          increment: nftsSold
        }
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
        nftsPurchased: {
          increment: amount
        }
      },
      create: {
        nftsPurchased: amount,
        userId: scoutId,
        season: builderNft.season
      }
    });

    return { balance: _balance };
  });

  await recordNftPurchaseQuests(scoutId).catch((error) => {
    log.error('Error completing quest', { error, builderId: builderNft.builderId, questType: 'scout-starter-card' });
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
