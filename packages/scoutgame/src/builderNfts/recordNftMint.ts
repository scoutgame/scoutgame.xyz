import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import type { Season } from '@packages/scoutgame/dates';
import { getCurrentWeek } from '@packages/scoutgame/dates';

import type { MintNFTParams } from './mintNFT';

export async function recordNftMint(params: MintNFTParams & { mintTxHash: string }) {
  const { amount, builderNftId, paidWithPoints, pointsValue, recipientAddress, scoutId, mintTxHash } = params;

  if (!mintTxHash.trim().startsWith('0x')) {
    throw new InvalidInputError(`Mint transaction hash is required`);
  }

  const existingTx = await prisma.nFTPurchaseEvent.findFirst({
    where: {
      txHash: mintTxHash
    }
  });

  if (existingTx) {
    log.warn(`Tried to record duplicate tx ${mintTxHash}`, { params, existingTx });
    return;
  }

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    },
    select: {
      season: true,
      tokenId: true,
      builderId: true,
      builder: {
        select: {
          displayName: true
        }
      }
    }
  });

  // The builder receives 20% of the points value, regardless of whether the purchase was paid with points or not
  const pointsReceipts: { value: number; recipientId?: string; senderId?: string }[] = [
    {
      value: Math.floor(pointsValue * 0.2),
      recipientId: builderNft.builderId
    }
  ];

  if (paidWithPoints) {
    pointsReceipts.push({
      value: pointsValue,
      senderId: scoutId
    });
  }

  const nftPurchaseEvent = await prisma.$transaction(async (tx) => {
    const owners = await tx.nFTPurchaseEvent.findMany({
      where: {
        builderNftId
      },
      select: {
        scoutId: true
      }
    });
    const uniqueOwners = Array.from(new Set(owners.map((owner) => owner.scoutId).concat(scoutId))).length;
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
            tokensPurchased: amount,
            paidInPoints: paidWithPoints,
            txHash: mintTxHash?.toLowerCase(),
            builderNftId,
            scoutId,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'nft_purchase',
                userId: builderNft.builderId
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
  log.info('Minted NFT', { builderNftId, recipientAddress, tokenId: builderNft.tokenId, amount, userId: scoutId });
  trackUserAction('nft_purchase', {
    userId: builderNft.builderId,
    amount,
    paidWithPoints,
    season: builderNft.season
  });
  await refreshBuilderNftPrice({ builderId: builderNft.builderId, season: builderNft.season });

  return {
    builderNft,
    mintTxHash,
    nftPurchaseEvent: nftPurchaseEvent as NFTPurchaseEvent
  };
}

export async function recordNftMintAndRefreshPrice(params: MintNFTParams & { mintTxHash: string }): Promise<void> {
  const minted = await recordNftMint(params);

  await refreshBuilderNftPrice({
    builderId: minted?.builderNft.builderId as string,
    season: minted?.builderNft.season as Season
  });
}