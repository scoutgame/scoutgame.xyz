import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { Address } from 'viem';

import {
  builderPointsShare as builderTokensShare,
  scoutPointsShare as scoutTokensShare
} from '../builderNfts/constants';

import { calculateEarnableScoutPointsForRank as calculateEarnableScoutTokensForRank } from './calculatePoints';

const nftTypeMultipliers: Record<BuilderNftType, number> = {
  starter_pack: 0.1,
  default: 1
};

export type TokenDistribution = {
  nftSupply: {
    default: number;
    starterPack: number;
    total: number;
  };
  earnableScoutTokens: number;
  tokensPerScout: {
    wallet: Address;
    nftTokens: number;
    erc20Tokens: number;
  }[];
  tokensForBuilder: number;
};

/**
 * Function to calculate scout tokens
 * @param builderId - ID of the builder
 * @param rank - Rank of the builder
 * @param weeklyAllocatedTokens - Tokens allocated for the week
 * @param normalisationFactor - Normalisation factor for tokens to ensure we hit the full quota allocated
 * @param owners - Snapshot of the owners of the NFTs purchased
 */
export async function divideTokensBetweenBuilderAndHolders({
  builderId,
  rank,
  weeklyAllocatedTokens,
  normalisationFactor,
  owners
}: {
  builderId: string;
  rank: number;
  weeklyAllocatedTokens: number;
  normalisationFactor: number;
  owners: WalletBuilderNftsOwnership[];
}): Promise<TokenDistribution> {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId must be a valid UUID');
  }

  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  // Calculate the total number of NFTs purchased by each scout
  const nftSupply = owners.reduce((acc, owner) => acc + owner.tokens.default, 0);

  const earnableScoutTokens = Math.floor(
    calculateEarnableScoutTokensForRank({ rank, weeklyAllocatedPoints: weeklyAllocatedTokens }) * normalisationFactor
  );

  const tokensPerScout = owners.map((owner) => {
    const scoutRewardShare = calculateRewardForScout({
      purchased: { default: owner.tokens.default, starterPack: 0 },
      supply: { default: nftSupply, starterPack: 0 }
    });
    const scoutTokens = Math.floor(scoutRewardShare * scoutTokensShare * earnableScoutTokens);

    return { wallet: owner.wallet, nftTokens: owner.tokens.default, erc20Tokens: scoutTokens };
  });

  const tokensForBuilder = Math.floor(builderTokensShare * earnableScoutTokens);

  return {
    nftSupply: {
      default: nftSupply,
      starterPack: 0,
      total: 0
    },
    earnableScoutTokens,
    tokensPerScout,
    tokensForBuilder
  };
}

// returs the percentage of the total tokens that the scout should receive
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
