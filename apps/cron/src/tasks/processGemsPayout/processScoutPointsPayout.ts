import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import type { WalletBuilderNftsOwnership } from '@packages/scoutgame/points/divideTokensBetweenBuilderAndHolders';
import { divideTokensBetweenBuilderAndHolders } from '@packages/scoutgame/points/divideTokensBetweenBuilderAndHolders';
import type { PartialNftPurchaseEvent } from '@packages/scoutgame/points/getWeeklyPointsPoolAndBuilders';
import { incrementPointsEarnedStats } from '@packages/scoutgame/points/updatePointsEarned';
import { uniqueValues } from '@packages/utils/array';
import { v4 } from 'uuid';
import { getAddress, type Address } from 'viem';

export async function processScoutPointsPayout({
  builderId,
  nftPurchaseEvents,
  rank,
  gemsCollected,
  week,
  blockNumber,
  season,
  createdAt,
  normalisationFactor = 1,
  weeklyAllocatedPoints
}: {
  builderId: string;
  nftPurchaseEvents: PartialNftPurchaseEvent[];
  rank: number;
  gemsCollected: number;
  week: string;
  blockNumber?: number;
  season: string;
  createdAt?: Date;
  normalisationFactor?: number;
  weeklyAllocatedPoints: number;
}) {
  const existingGemsPayoutEvent = await prisma.gemsPayoutEvent.findUnique({
    where: {
      builderId_week: {
        builderId,
        week
      }
    }
  });

  if (!blockNumber) {
    blockNumber = await getLastBlockOfWeek({
      chainId: builderNftChain.id,
      week
    });
  }

  if (existingGemsPayoutEvent) {
    scoutgameMintsLogger.warn(`Gems payout event already exists for builder in week ${week}`, { userId: builderId });
    return;
  }

  const builderNft = await prisma.builderNft.findUniqueOrThrow({
    where: {
      builderId_season_nftType: {
        builderId,
        season,
        nftType: BuilderNftType.default
      }
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutWallet: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  const builderNftOwnerAddresses = uniqueValues(
    builderNft.nftSoldEvents
      .flatMap(({ scoutWallet }) => (scoutWallet?.address ? getAddress(scoutWallet.address) : undefined))
      .filter((address) => !!address) as Address[]
  );

  const nftBalances = await getPreSeasonTwoBuilderNftContractReadonlyClient({
    chain: builderNftChain,
    contractAddress: builderNft.contractAddress as Address
  }).balanceOfBatch({
    args: {
      accounts: builderNftOwnerAddresses,
      tokenIds: Array.from({ length: builderNftOwnerAddresses.length }, (_, i) => BigInt(builderNft.tokenId))
    }
  });

  const resolvedNftBalances: WalletBuilderNftsOwnership[] = nftBalances.map((_walletBalance, index) => ({
    wallet: builderNftOwnerAddresses[index] as Address,
    tokens: {
      [BuilderNftType.starter_pack]: Number(_walletBalance),
      [BuilderNftType.default]: 0
    }
  }));

  const starterPackNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        builderId,
        season,
        nftType: BuilderNftType.starter_pack
      }
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutWallet: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  if (starterPackNft) {
    const starterPackNftOwnerAddresses = uniqueValues(
      starterPackNft.nftSoldEvents
        .flatMap(({ scoutWallet }) => (scoutWallet?.address ? getAddress(scoutWallet.address) : undefined))
        .filter((address) => !!address) as Address[]
    );

    const onchainStarterPackBalances = await getPreSeasonTwoBuilderNftContractReadonlyClient({
      chain: builderNftChain,
      contractAddress: starterPackNft.contractAddress as Address
    }).balanceOfBatch({
      args: {
        accounts: starterPackNftOwnerAddresses,
        tokenIds: Array.from({ length: starterPackNftOwnerAddresses.length }, (_, i) => BigInt(starterPackNft.tokenId))
      }
    });

    for (let index = 0; index < starterPackNftOwnerAddresses.length; index++) {
      const account = starterPackNftOwnerAddresses[index];
      const balance = onchainStarterPackBalances[index];

      const existingBalanceIndex = resolvedNftBalances.findIndex((nftBalance) => nftBalance.wallet === account);
      if (existingBalanceIndex !== -1) {
        resolvedNftBalances[existingBalanceIndex].tokens[BuilderNftType.starter_pack] = Number(balance);
      } else {
        resolvedNftBalances.push({
          wallet: account,
          tokens: {
            [BuilderNftType.starter_pack]: Number(balance),
            [BuilderNftType.default]: 0
          }
        });
      }
    }
  }

  const { tokensForBuilder, tokensPerScout, nftSupply } = await divideTokensBetweenBuilderAndHolders({
    builderId,
    rank,
    weeklyAllocatedTokens: weeklyAllocatedPoints,
    normalisationFactor,
    owners: resolvedNftBalances
  });

  if (nftSupply.total === 0) {
    scoutgameMintsLogger.warn(`No NFTs purchased for builder in season ${season}`, { userId: builderId });
    return;
  }

  const earnableScoutPoints = Math.floor(
    calculateEarnableScoutPointsForRank({ rank, weeklyAllocatedPoints }) * normalisationFactor
  );

  return prisma.$transaction(
    async (tx) => {
      const builderEventId = v4();

      await tx.gemsPayoutEvent.create({
        data: {
          gems: gemsCollected,
          points: earnableScoutPoints,
          week,
          season,
          builderId,
          builderEvent: {
            create: {
              id: builderEventId,
              type: 'gems_payout',
              season,
              week,
              builderId,
              createdAt
            }
          }
        }
      });

      const scoutWallets = await prisma.scoutWallet.findMany({
        where: {
          address: {
            in: tokensPerScout.map(({ wallet }) => wallet)
          }
        }
      });

      const walletToScoutId = scoutWallets.reduce(
        (acc, { address, scoutId }) => {
          acc[address.toLowerCase() as Address] = scoutId;
          return acc;
        },
        {} as Record<Address, string>
      );

      await Promise.all([
        ...tokensPerScout.map(async ({ wallet, erc20Tokens }) => {
          await tx.pointsReceipt.create({
            data: {
              value: erc20Tokens,
              recipientId: walletToScoutId[wallet.toLowerCase() as Address],
              eventId: builderEventId,
              season,
              activities: {
                create: {
                  recipientType: 'scout',
                  type: 'points',
                  userId: walletToScoutId[wallet.toLowerCase() as Address],
                  createdAt
                }
              }
            }
          });
          await incrementPointsEarnedStats({
            userId: walletToScoutId[wallet.toLowerCase() as Address],
            season,
            scoutPoints: erc20Tokens,
            tx
          });
        }),
        tx.pointsReceipt.create({
          data: {
            value: tokensForBuilder,
            recipientId: builderId,
            eventId: builderEventId,
            season,
            activities: {
              create: {
                recipientType: 'builder',
                type: 'points',
                userId: builderId,
                createdAt
              }
            }
          }
        }),
        incrementPointsEarnedStats({
          userId: builderId,
          season,
          builderPoints: tokensForBuilder,
          tx
        })
      ]);
    },
    {
      timeout: 100000
    }
  );
}
