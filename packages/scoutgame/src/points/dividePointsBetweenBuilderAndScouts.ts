import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNftType } from '@charmverse/core/prisma';
import { stringUtils } from '@charmverse/core/utilities';

import { builderPointsShare, scoutPointsShare } from '../builderNfts/constants';
import { calculateEarnableScoutPointsForRank } from '../points/calculatePoints';

import type { PartialNftPurchaseEvent } from './getWeeklyPointsPoolAndBuilders';

const nftTypeMultipliers: Record<BuilderNftType, number> = {
  starter_pack: 0.1,
  default: 1
};

/**
 * Function to calculate scout points
 * @param builderId - ID of the builder
 * @param season - Season identifier
 * @param week - Week identifier
 * @param rank - Rank of the builder
 * @param weeklyAllocatedPoints - Points allocated for the week
 * @param normalisationFactor - Normalisation factor for points to ensure we hit the full quota allocated
 * @param nftPurchaseEvents - NFT purchase events for the builder
 */
export function dividePointsBetweenBuilderAndScouts({
  builderId,
  rank,
  weeklyAllocatedPoints,
  normalisationFactor,
  nftPurchaseEvents
}: {
  builderId: string;
  rank: number;
  weeklyAllocatedPoints: number;
  normalisationFactor: number;
  nftPurchaseEvents: PartialNftPurchaseEvent[];
}) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId must be a valid UUID');
  }

  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  // Calculate the total number of NFTs purchased by each scout
  const { nftSupply, nftsByScout } = nftPurchaseEvents
    .filter((event) => event.builderNft.builderId === builderId)
    .reduce(
      (acc, purchaseEvent) => {
        acc.nftsByScout[purchaseEvent.scoutId] = acc.nftsByScout[purchaseEvent.scoutId] || {
          default: 0,
          starterPack: 0
        };
        if (purchaseEvent.builderNft.nftType === 'default') {
          acc.nftsByScout[purchaseEvent.scoutId].default += purchaseEvent.tokensPurchased;
          acc.nftSupply.default += purchaseEvent.tokensPurchased;
        } else {
          acc.nftsByScout[purchaseEvent.scoutId].starterPack += purchaseEvent.tokensPurchased;
          acc.nftSupply.starterPack += purchaseEvent.tokensPurchased;
        }
        return acc;
      },
      {
        nftSupply: { default: 0, starterPack: 0 },
        nftsByScout: {} as Record<string, { default: number; starterPack: number }>
      }
    );

  const earnableScoutPoints = Math.floor(
    calculateEarnableScoutPointsForRank({ rank, weeklyAllocatedPoints }) * normalisationFactor
  );

  const pointsPerScout = Object.entries(nftsByScout).map(([scoutId, tokensPurchased]) => {
    const scoutRewardShare = calculateRewardForScout({
      purchased: tokensPurchased,
      supply: nftSupply
    });
    const scoutPoints = Math.floor(scoutRewardShare * scoutPointsShare * earnableScoutPoints);

    return { scoutId, scoutPoints };
  });

  const pointsForBuilder = Math.floor(builderPointsShare * earnableScoutPoints);

  return {
    nftSupply: {
      default: nftSupply.default,
      starterPack: nftSupply.starterPack,
      total: nftSupply.default + nftSupply.starterPack
    },
    nftsByScout,
    earnableScoutPoints,
    pointsPerScout,
    pointsForBuilder
  };
}

// returs the percentage of the total points that the scout should receive
export function calculateRewardForScout({
  purchased,
  supply
}: {
  purchased: { starterPack?: number; default: number };
  supply: { starterPack: number; default: number };
}) {
  const rewardPerNft = 1 / (supply.starterPack * nftTypeMultipliers.starter_pack + supply.default);
  return (purchased.default + (purchased.starterPack || 0) * nftTypeMultipliers.starter_pack) * rewardPerNft;
}
