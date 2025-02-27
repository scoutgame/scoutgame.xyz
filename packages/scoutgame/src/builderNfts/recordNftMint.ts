import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { updateReferralUsers } from '@packages/users/referrals/updateReferralUsers';
import { baseUrl } from '@packages/utils/constants';
import type { Address } from 'viem';

import { refreshBuilderNftPrice } from '../builderNfts/refreshBuilderNftPrice';
import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { recordNftPurchaseQuests } from '../quests/recordNftPurchaseQuests';

import { builderTokenDecimals } from './constants';
import { getMatchingNFTPurchaseEvent } from './getMatchingNFTPurchaseEvent';
import type { MintNFTParams } from './mintNFT';
import { refreshEstimatedPayouts } from './refreshEstimatedPayouts';
import { refreshScoutNftBalance } from './refreshScoutNftBalance';

export async function recordNftMint(
  params: Omit<MintNFTParams, 'nftType' | 'scoutId'> & {
    createdAt?: Date;
    mintTxHash: string;
    mintTxLogIndex: number;
    skipMixpanel?: boolean;
    skipPriceRefresh?: boolean;
  }
) {
  const {
    season = getCurrentSeasonStart(),
    amount,
    builderNftId,
    paidWithPoints,
    recipientAddress,
    mintTxLogIndex,
    pointsValue,
    createdAt,
    mintTxHash,
    skipMixpanel,
    skipPriceRefresh
  } = params;

  if (!mintTxHash.trim().startsWith('0x')) {
    throw new InvalidInputError(`Mint transaction hash is required`);
  }

  const { id: scoutId } = await findOrCreateWalletUser({
    wallet: recipientAddress
  });

  const existingTx = await getMatchingNFTPurchaseEvent({
    builderNftId,
    txHash: mintTxHash,
    txLogIndex: mintTxLogIndex,
    senderWalletAddress: null,
    walletAddress: recipientAddress,
    tokensPurchased: amount
  });

  if (existingTx) {
    scoutgameMintsLogger.warn(`Tried to record duplicate tx ${mintTxHash}`, { params, existingTx });
    return;
  }

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId,
      season
    },
    select: {
      nftType: true,
      season: true,
      tokenId: true,
      builderId: true,
      contractAddress: true,
      imageUrl: true,
      builder: {
        select: {
          path: true,
          hasMoxieProfile: true,
          displayName: true
        }
      }
    }
  });

  // The builder receives 20% of the points value, regardless of whether the purchase was paid with points or not
  const pointsReceipts: { value: number; recipientId?: string; senderId?: string; createdAt?: Date; season: string }[] =
    [
      {
        value: Math.floor(pointsValue * 0.2),
        recipientId: builderNft.builderId,
        createdAt,
        season
      }
    ];

  if (paidWithPoints) {
    pointsReceipts.push({
      value: pointsValue,
      senderId: scoutId,
      createdAt,
      season
    });
  }

  const nftPurchaseEvent = await prisma.$transaction(async (tx) => {
    const owners = await tx.nFTPurchaseEvent.findMany({
      where: {
        builderNftId,
        walletAddress: {
          not: null
        }
      },
      select: {
        scoutWallet: {
          select: {
            scoutId: true
          }
        }
      }
    });
    const uniqueOwners = Array.from(new Set(owners.map((owner) => owner.scoutWallet!.scoutId).concat(scoutId))).length;

    const builderEvent = await tx.builderEvent.create({
      data: {
        type: 'nft_purchase',
        season: builderNft.season,
        week: getCurrentWeek(),
        builder: {
          connect: {
            id: builderNft.builderId
          }
        },
        nftPurchaseEvent: {
          create: {
            pointsValue,
            createdAt,
            tokensPurchased: amount,
            paidInPoints: paidWithPoints,
            txHash: mintTxHash?.toLowerCase(),
            builderNftId,
            walletAddress: recipientAddress.toLowerCase() as `0x${string}`,
            txLogIndex: mintTxLogIndex,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'nft_purchase',
                userId: builderNft.builderId,
                createdAt
              }
            }
          }
        },
        pointsReceipts: {
          createMany: {
            data: pointsReceipts
          }
        }
      },
      select: {
        nftPurchaseEvent: true
      }
    });

    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: builderNft.builderId,
          season: builderNft.season
        }
      },
      create: {
        nftOwners: uniqueOwners,
        nftsSold: amount,
        userId: builderNft.builderId,
        season: builderNft.season,
        pointsEarnedAsBuilder: 0,
        pointsEarnedAsScout: 0
      },
      update: {
        nftOwners: uniqueOwners,
        nftsSold: {
          increment: amount
        }
      }
    });
    await tx.userSeasonStats.upsert({
      where: {
        userId_season: {
          userId: scoutId,
          season: builderNft.season
        }
      },
      create: {
        nftsPurchased: amount,
        userId: scoutId,
        season: builderNft.season,
        pointsEarnedAsBuilder: 0,
        pointsEarnedAsScout: 0
      },
      update: {
        nftsPurchased: {
          increment: amount
        }
      }
    });

    if (paidWithPoints) {
      await tx.scout.update({
        where: {
          id: scoutId
        },
        data: {
          currentBalance: {
            decrement: pointsValue
          }
        }
      });
    }

    return builderEvent.nftPurchaseEvent;
  });

  scoutgameMintsLogger.info('Minted NFT', {
    builderNftId,
    recipientAddress,
    tokenId: builderNft.tokenId,
    amount,
    userId: scoutId
  });

  if (!skipPriceRefresh) {
    await refreshBuilderNftPrice({
      builderId: builderNft.builderId,
      season: builderNft.season as Season
    });
  }

  try {
    await recordNftPurchaseQuests(scoutId, skipMixpanel);
  } catch (error) {
    log.error('Error completing quest', { error, builderId: builderNft.builderId, questType: 'scout-starter-card' });
  }

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
          currentPrice: true
        }
      })
    ]);
    await sendEmailTemplate({
      senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
      subject: 'Your Builder Card Was Just Scouted! 🎉',
      templateType: 'builder_card_scouted',
      userId: builderNft.builderId,
      templateVariables: {
        builder_name: builderNft.builder.displayName,
        builder_profile_link: `${baseUrl}/u/${builderNft.builder.path}`,
        cards_purchased: amount,
        total_purchase_cost: pointsValue,
        builder_card_image: builderNft.imageUrl,
        scout_name: scout.displayName,
        scout_profile_link: `${baseUrl}/u/${scout.path}`,
        // TODO: use currentPriceInScoutToken when we move to $SCOUT
        current_card_price: (Number(nft.currentPrice || 0) / 10 ** builderTokenDecimals).toFixed(2)
      }
    });
  } catch (error) {
    log.error('Error sending builder card scouted email', { error, builderId: builderNft.builderId, userId: scoutId });
  }

  const week = getCurrentWeek();

  await refreshEstimatedPayouts({
    week,
    builderIdToRefresh: builderNft.builderId
  }).catch((error) => {
    log.error('Error refreshing estimated payouts', { error, builderId: builderNft.builderId, userId: scoutId, week });
  });

  await refreshScoutNftBalance({
    contractAddress: builderNft.contractAddress as Address,
    nftType: builderNft.nftType,
    tokenId: builderNft.tokenId,
    wallet: recipientAddress.toLowerCase() as `0x${string}`
  });

  try {
    // check if we should count a referral
    await updateReferralUsers(scoutId);
  } catch (error) {
    log.error('Error recording referral bonus', { error, builderId: builderNft.builderId, userId: scoutId });
  }

  return {
    builderNft,
    mintTxHash,
    nftPurchaseEvent: nftPurchaseEvent as NFTPurchaseEvent
  };
}
