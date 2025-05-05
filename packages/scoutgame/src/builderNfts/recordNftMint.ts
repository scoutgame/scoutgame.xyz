import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getWeekFromDate } from '@packages/dates/utils';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import type { Address } from 'viem';

import { sendNotifications } from '../notifications/sendNotifications';
import { devTokenDecimals } from '../protocol/constants';

import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';
import { refreshEstimatedPayouts } from './refreshEstimatedPayouts';
import { refreshNftPurchaseStats } from './refreshNftPurchaseStats';
import { refreshScoutNftBalance } from './refreshScoutNftBalance';

export async function recordNftMint({
  builderNftId,
  recipientAddress,
  scoutId,
  amount,
  tokenValue,
  sentAt = new Date(),
  txLogIndex,
  txHash
}: {
  builderNftId: string;
  recipientAddress: Address;
  scoutId: string;
  amount: number;
  tokenValue: number;
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
      currentPriceDevToken: true,
      imageUrl: true,
      builder: {
        select: {
          displayName: true,
          path: true
        }
      }
    }
  });

  const week = getWeekFromDate(sentAt);

  await prisma.builderEvent.create({
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
          pointsValue: tokenValue,
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

  const balance = await refreshScoutNftBalance({
    contractAddress: builderNft.contractAddress as Address,
    nftType: builderNft.nftType,
    tokenId: builderNft.tokenId,
    wallet: recipientAddress.toLowerCase() as Address
  });

  await refreshBuilderNftPrice({
    season: builderNft.season,
    builderId: builderNft.builderId
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
      const scout = await prisma.scout.findUniqueOrThrow({
        where: {
          id: scoutId
        },
        select: {
          displayName: true,
          path: true
        }
      });

      const currentCardPrice = Number(
        BigInt(builderNft.currentPriceDevToken || 0) / BigInt(10 ** devTokenDecimals)
      ).toFixed(2);

      await sendNotifications({
        notificationType: 'builder_card_scouted',
        userId: builderNft.builderId,
        email: {
          templateVariables: {
            builder_name: builderNft.builder.displayName,
            builder_profile_link: `https://scoutgame.xyz/u/${builderNft.builder.path}`,
            cards_purchased: amount,
            total_purchase_cost: tokenValue,
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
      log.error('Error sending dev card scouted email', {
        error,
        builderId: builderNft.builderId,
        userId: scoutId
      });
    }
  }

  try {
    // check if we should count a referral
    await updateReferralUsers(scoutId);
  } catch (error) {
    log.error('Error recording referral bonus', { error, builderId: builderNft.builderId, userId: scoutId });
  }

  await refreshNftPurchaseStats({
    scoutId,
    builderId: builderNft.builderId,
    season: builderNft.season
  });

  try {
    await prisma.userSeasonStats.update({
      where: {
        userId_season: {
          userId: builderNft.builderId,
          season: builderNft.season
        }
      },
      data: {
        pointsEarnedAsBuilder: { increment: tokenValue * 0.2 }
      }
    });
    await prisma.userAllTimeStats.upsert({
      where: {
        userId: builderNft.builderId
      },
      create: {
        pointsEarnedAsBuilder: tokenValue * 0.2,
        user: {
          connect: {
            id: builderNft.builderId
          }
        }
      },
      update: {
        pointsEarnedAsBuilder: { increment: tokenValue * 0.2 }
      }
    });
  } catch (error) {
    log.error('Error updating developer stats after nft mint', {
      error,
      userId: builderNft.builderId
    });
  }

  return { balance };
}
