import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { calculateEarnableScoutPointsForRank } from '@packages/scoutgame/points/calculatePoints';
import { divideTokensBetweenBuilderAndHolders } from '@packages/scoutgame/points/divideTokensBetweenBuilderAndHolders';
import { incrementPointsEarnedStats } from '@packages/scoutgame/points/updatePointsEarned';
import { resolveTokenOwnershipForBuilder } from '@packages/scoutgame/protocol/resolveTokenOwnershipForBuilder';
import { v4 } from 'uuid';
import { type Address } from 'viem';

const log = getLogger('cron-process-scout-points-payout');

export async function processScoutPointsPayout({
  builderId,
  rank,
  gemsCollected,
  week,
  season,
  createdAt,
  normalisationFactor = 1,
  weeklyAllocatedPoints
}: {
  builderId: string;
  rank: number;
  gemsCollected: number;
  week: string;
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

  if (existingGemsPayoutEvent) {
    log.warn(`Gems payout event already exists for builder in week ${week}`, { userId: builderId });
    return;
  }

  const resolvedNftBalances = await resolveTokenOwnershipForBuilder({
    week,
    builderId
  });

  const { tokensForBuilder, tokensPerScoutByWallet, nftSupply } = divideTokensBetweenBuilderAndHolders({
    builderId,
    rank,
    weeklyAllocatedTokens: weeklyAllocatedPoints,
    normalisationFactor,
    owners: resolvedNftBalances
  });

  if (nftSupply.total === 0) {
    log.warn(`No NFTs purchased for builder in season ${season}`, { userId: builderId });
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
            in: tokensPerScoutByWallet.map(({ wallet }) => wallet)
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
        ...tokensPerScoutByWallet.map(async ({ wallet, erc20Tokens }) => {
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
