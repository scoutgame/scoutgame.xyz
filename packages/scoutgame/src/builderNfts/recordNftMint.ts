import { InvalidInputError } from '@charmverse/core/errors';
import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import type { Season } from '@packages/scoutgame/dates';
import { getCurrentWeek } from '@packages/scoutgame/dates';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { completeQuest } from '../quests/completeQuest';

import type { MintNFTParams } from './mintNFT';

export async function recordNftMint(
  params: Omit<MintNFTParams, 'nftType'> & {
    createdAt?: Date;
    mintTxHash: string;
    skipMixpanel?: boolean;
    skipPriceRefresh?: boolean;
  }
) {
  const {
    amount,
    builderNftId,
    paidWithPoints,
    recipientAddress,
    scoutId,
    pointsValue,
    createdAt,
    mintTxHash,
    skipMixpanel,
    skipPriceRefresh
  } = params;

  if (!mintTxHash.trim().startsWith('0x')) {
    throw new InvalidInputError(`Mint transaction hash is required`);
  }

  const existingTx = await prisma.nFTPurchaseEvent.findFirst({
    where: {
      txHash: mintTxHash
    }
  });

  if (existingTx) {
    scoutgameMintsLogger.warn(`Tried to record duplicate tx ${mintTxHash}`, { params, existingTx });
    return;
  }

  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    },
    select: {
      nftType: true,
      season: true,
      tokenId: true,
      builderId: true,
      builder: {
        select: {
          path: true,
          displayName: true,
          hasMoxieProfile: true
        }
      }
    }
  });

  // The builder receives 20% of the points value, regardless of whether the purchase was paid with points or not
  const pointsReceipts: { value: number; recipientId?: string; senderId?: string; createdAt?: Date }[] = [
    {
      value: Math.floor(pointsValue * 0.2),
      recipientId: builderNft.builderId,
      createdAt
    }
  ];

  if (paidWithPoints) {
    pointsReceipts.push({
      value: pointsValue,
      senderId: scoutId,
      createdAt
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
            createdAt,
            tokensPurchased: amount,
            paidInPoints: paidWithPoints,
            txHash: mintTxHash?.toLowerCase(),
            builderNftId,
            scoutId,
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

  if (!skipMixpanel) {
    trackUserAction('nft_purchase', {
      userId: builderNft.builderId,
      amount,
      paidWithPoints,
      builderPath: builderNft.builder.path!,
      season: builderNft.season,
      nftType: builderNft.nftType
    });
  }

  if (!skipPriceRefresh) {
    await refreshBuilderNftPrice({
      builderId: builderNft.builderId,
      season: builderNft.season as Season
    });
  }

  const scoutNftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      scoutId
    },
    select: {
      builderNftId: true,
      builderNft: {
        select: {
          nftType: true
        }
      },
      tokensPurchased: true
    }
  });

  const starterPackCardPurchases = scoutNftPurchaseEvents.filter(
    (event) => event.builderNft.nftType === 'starter_pack'
  );
  const fullSeasonCardPurchases = scoutNftPurchaseEvents.filter((event) => event.builderNft.nftType === 'default');

  const totalStarterPackCardsPurchased = starterPackCardPurchases.reduce((acc, event) => {
    return acc + event.tokensPurchased;
  }, 0);
  const totalFullSeasonCardsPurchased = fullSeasonCardPurchases.reduce((acc, event) => {
    return acc + event.tokensPurchased;
  }, 0);
  const totalCardsPurchased = totalStarterPackCardsPurchased + totalFullSeasonCardsPurchased;
  const uniqueCardPurchases = new Set(scoutNftPurchaseEvents.map((event) => event.builderNftId)).size;

  if (builderNft.nftType === 'starter_pack') {
    // First starter pack card purchased
    if (totalStarterPackCardsPurchased === 1) {
      await completeQuest(scoutId, 'scout-starter-card');
    }
    // All 3 starter pack cards purchased
    else if (totalStarterPackCardsPurchased === 3) {
      await completeQuest(scoutId, 'scout-3-starter-cards');
    }
  } else if (builderNft.nftType === 'default') {
    // First full season card purchased
    if (totalFullSeasonCardsPurchased === 1) {
      await completeQuest(scoutId, 'scout-full-season-card');
    }
  }

  // 5 unique cards purchased
  if (uniqueCardPurchases === 5) {
    await completeQuest(scoutId, 'scout-5-builders');
  }

  // This is a new scout and thus they have entered the OP New Scout Competition
  if (totalCardsPurchased === 1) {
    await completeQuest(scoutId, 'enter-op-new-scout-competition');
  }

  // If the scout purchased a card of a moxie builder, mark the moxie quest as complete
  if (builderNft.builder.hasMoxieProfile) {
    await completeQuest(scoutId, 'scout-moxie-builder');
  }

  return {
    builderNft,
    mintTxHash,
    nftPurchaseEvent: nftPurchaseEvent as NFTPurchaseEvent
  };
}
