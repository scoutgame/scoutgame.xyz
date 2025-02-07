import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { Address } from 'viem';

import type { TokenOwnershipForBuilder } from '../protocol/resolveTokenOwnershipForBuilder';

import { calculateEarnableScoutPointsForRank as calculateEarnableScoutTokensForRank } from './calculatePoints';

// percent of rewards that go to the builder
export const builderRewardsPool = 0.2;

export type TokenDistribution = {
  nftSupply: {
    default: number;
    starterPack: number;
    total: number;
  };
  earnableScoutTokens: number;
  tokensPerScoutByWallet: {
    wallet: Address;
    nftTokens: number;
    erc20Tokens: number;
  }[];
  tokensPerScoutByScoutId: {
    scoutId: string;
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
export function divideTokensBetweenBuilderAndHolders({
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
  owners: TokenOwnershipForBuilder;
}): TokenDistribution {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId must be a valid UUID');
  }

  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  // Calculate the total number of NFTs purchased by each scout
  const nftSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalNft, 0);
  const starterPackSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalStarter, 0);

  const earnableScoutTokens = Math.floor(
    calculateEarnableScoutTokensForRank({ rank, weeklyAllocatedPoints: weeklyAllocatedTokens }) * normalisationFactor
  );

  const tokensPerScoutByWallet = owners.byWallet.map((owner) => {
    const scoutRewardShare = calculateRewardForScout({
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply }
    });
    const scoutTokens = Math.floor(scoutRewardShare * earnableScoutTokens);

    return { wallet: owner.wallet, nftTokens: owner.totalNft, erc20Tokens: scoutTokens };
  });

  const tokensPerScoutByScoutId = owners.byScoutId.map((owner) => {
    const scoutRewardShare = calculateRewardForScout({
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply }
    });
    const scoutTokens = Math.floor(scoutRewardShare * earnableScoutTokens);

    return { scoutId: owner.scoutId, nftTokens: owner.totalNft, erc20Tokens: scoutTokens };
  });

  const tokensForBuilder = Math.floor(builderRewardsPool * earnableScoutTokens);

  return {
    nftSupply: {
      default: nftSupply,
      starterPack: starterPackSupply,
      total: nftSupply + starterPackSupply
    },
    earnableScoutTokens,
    tokensPerScoutByWallet,
    tokensPerScoutByScoutId,
    tokensForBuilder
  };
}

// Returns the percentage of the total weekly rewards that a scout should receive
// Scout share percent = 0.7 * (owned default NFT / total default NFTs) + 0.1 * (owned starter pack NFT / total starter pack NFTs)
export function calculateRewardForScout({
  builderPool = 0.2,
  starterPackPool = 0.1,
  purchased,
  supply
}: {
  builderPool?: number;
  starterPackPool?: number;
  purchased: { starterPack?: number; default?: number };
  supply: { starterPack: number; default: number };
}): number {
  const builderHasStarterPacks = supply.starterPack > 0;
  // TODO: all builders will have starter packs in the future, and starterPackPool will always be .1
  starterPackPool = builderHasStarterPacks ? starterPackPool : 0;
  const defaultPool = 1 - builderPool - starterPackPool;

  // sanity check
  if (defaultPool <= 0) {
    throw new Error(
      `Default pool of ${defaultPool} is less than 0. Builder pool: ${builderPool}, starter pack pool: ${starterPackPool}`
    );
  }

  const shareOfDefault = supply.default <= 0 ? 0 : (purchased.default ?? 0) / supply.default;
  const shareOfStarterPack = supply.starterPack <= 0 ? 0 : (purchased.starterPack ?? 0) / supply.starterPack;
  return shareOfDefault * defaultPool + shareOfStarterPack * starterPackPool;
}
