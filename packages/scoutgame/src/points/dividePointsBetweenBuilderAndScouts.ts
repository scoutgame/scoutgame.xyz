import { prisma } from '@charmverse/core/prisma-client';

import { builderPointsShare, scoutPointsShare } from '../builderNfts/constants';
import { calculateEarnableScoutPointsForRank } from '../points/calculatePoints';

/**
 * Function to calculate scout points
 * @param builderId - ID of the builder
 * @param season - Season identifier
 * @param rank - Rank of the builder
 * @param weeklyAllocatedPoints - Points allocated for the week
 * @param normalisationFactor - Normalisation factor for points to ensure we hit the full quota allocated
 * @returns {Promise<{ totalNftsPurchased: number, nftsByScout: Record<string, number>, earnableScoutPoints: number }>}
 */
export async function dividePointsBetweenBuilderAndScouts({
  builderId,
  season,
  rank,
  weeklyAllocatedPoints,
  normalisationFactor
}: {
  builderId: string;
  season: string;
  rank: number;
  weeklyAllocatedPoints: number;
  normalisationFactor: number;
}) {
  const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
    where: {
      builderNFT: {
        season,
        builderId
      }
    }
  });

  const { totalNftsPurchased, nftsByScout } = nftPurchaseEvents.reduce(
    (acc, purchaseEvent) => {
      acc.totalNftsPurchased += purchaseEvent.tokensPurchased;
      acc.nftsByScout[purchaseEvent.scoutId] =
        (acc.nftsByScout[purchaseEvent.scoutId] || 0) + purchaseEvent.tokensPurchased;
      return acc;
    },
    {
      totalNftsPurchased: 0,
      nftsByScout: {} as Record<string, number>
    }
  );

  const earnableScoutPoints = Math.floor(
    calculateEarnableScoutPointsForRank({ rank, weeklyAllocatedPoints }) * normalisationFactor
  );

  const pointsPerScout = Object.entries(nftsByScout).map(([scoutId, tokensPurchased]) => {
    const scoutPoints = Math.floor(scoutPointsShare * earnableScoutPoints * (tokensPurchased / totalNftsPurchased));

    return { scoutId, scoutPoints };
  });

  const pointsForBuilder = Math.floor(builderPointsShare * earnableScoutPoints);

  return { totalNftsPurchased, nftsByScout, earnableScoutPoints, pointsPerScout, pointsForBuilder };
}
