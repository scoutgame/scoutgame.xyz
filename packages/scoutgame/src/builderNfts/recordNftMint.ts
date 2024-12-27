import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { NFTPurchaseEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { refreshBuilderNftPrice } from '@packages/scoutgame/builderNfts/refreshBuilderNftPrice';
import type { Season } from '@packages/scoutgame/dates';
import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { referralBonusPoints } from '../constants';
import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import type { MintNFTParams } from './mintNFT';
import { recordNftPurchaseQuests } from './recordNftPurchaseQuests';

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
    // Find the referrer of the scout first
    const referrer = await prisma.scout.findFirst({
      where: {
        events: {
          some: {
            referralCodeEvent: {
              refereeId: scoutId
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    if (referrer) {
      const referralCodeEvent = await prisma.referralCodeEvent.findFirst({
        where: {
          refereeId: scoutId
        },
        select: {
          id: true
        }
      });

      // If the referral code event exists and doesn't have a bonus event, create one
      if (referralCodeEvent && !referralCodeEvent.bonusEvent) {
        await prisma.$transaction(async (tx) => {
          await tx.builderEvent.create({
            data: {
              type: 'referral_bonus',
              season: currentSeason,
              description: 'Received points for a referred user scouting a builder',
              week: getCurrentWeek(),
              builder: {
                connect: {
                  id: referrer.id
                }
              },
              referralBonusEvent: {
                connect: {
                  id: referralCodeEvent.id
                }
              },
              pointsReceipts: {
                create: {
                  value: referralBonusPoints,
                  claimedAt: new Date(),
                  recipient: {
                    connect: {
                      id: referrer.id
                    }
                  }
                }
              }
            }
          });

          await tx.scout.update({
            where: {
              id: referrer.id
            },
            data: {
              currentBalance: {
                increment: referralBonusPoints
              }
            }
          });
        });
      }
    }
  } catch (error) {
    log.error('Error recording referral bonus', { error, builderId: builderNft.builderId, scoutId });
  }

  return {
    builderNft,
    mintTxHash,
    nftPurchaseEvent: nftPurchaseEvent as NFTPurchaseEvent
  };
}
