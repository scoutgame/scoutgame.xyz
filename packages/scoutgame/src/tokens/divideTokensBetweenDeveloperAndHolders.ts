import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Address } from 'viem';

import type { TokenOwnershipForBuilder } from '../protocol/resolveTokenOwnershipForBuilder';

import { calculateEarnableTokensForRank } from './calculateTokens';

// percent that goes to the developer
export const defaultDeveloperPool = 20;
// go to owners of starter pack
export const defaultStarterPackPool = 10;
// go to owners of default NFTs
export const defaultScoutPool = 70;

export type TokenDistribution = {
  nftSupply: {
    default: number;
    starterPack: number;
    total: number;
  };
  earnableTokens: bigint;
  tokensPerScoutByWallet: {
    wallet: Address;
    nftTokens: number;
    erc20Tokens: bigint;
  }[];
  tokensPerScoutByScoutId: {
    scoutId: string;
    nftTokens: number;
    erc20Tokens: bigint;
  }[];
  tokensForDeveloper: bigint;
};

/**
 * Function to calculate scout tokens
 * @param developerId - ID of the builder
 * @param rank - Rank of the builder
 * @param weeklyAllocatedTokens - Tokens allocated for the week
 * @param normalisationFactor - Normalisation factor for tokens to ensure we hit the full quota allocated
 * @param owners - Snapshot of the owners of the NFTs purchased
 */
export function divideTokensBetweenDeveloperAndHolders({
  rank,
  weeklyAllocatedTokens,
  normalisationFactor,
  owners
}: {
  rank: number;
  weeklyAllocatedTokens: bigint;
  normalisationFactor: number;
  owners: TokenOwnershipForBuilder;
}): TokenDistribution {
  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  // Calculate the total number of NFTs purchased by each scout
  const nftSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalNft, 0);
  const starterPackSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalStarter, 0);

  const earnableTokens = calculateEarnableTokensForRank({ rank, weeklyAllocatedTokens }) * BigInt(normalisationFactor);

  const tokensPerScoutByWallet = owners.byWallet.map((owner) => {
    const scoutReward = calculateRewardForScout({
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply },
      scoutsRewardPool: earnableTokens
    });
    return { wallet: owner.wallet, nftTokens: owner.totalNft, erc20Tokens: scoutReward };
  });

  const tokensPerScoutByScoutId = owners.byScoutId.map((owner) => {
    const scoutReward = calculateRewardForScout({
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply },
      scoutsRewardPool: earnableTokens
    });

    return { scoutId: owner.scoutId, nftTokens: owner.totalNft, erc20Tokens: scoutReward };
  });

  const tokensForDeveloper = (BigInt(defaultDeveloperPool) * earnableTokens) / BigInt(100);

  return {
    nftSupply: {
      default: nftSupply,
      starterPack: starterPackSupply,
      total: nftSupply + starterPackSupply
    },
    earnableTokens,
    tokensPerScoutByWallet,
    tokensPerScoutByScoutId,
    tokensForDeveloper
  };
}

// Returns the total weekly rewards that a scout should receive
// Note: We use whole numbers for pools to avoid issues with addition and subtraction of floating point numbers
export function calculateRewardForScout({
  developerPool = defaultDeveloperPool,
  starterPackPool = defaultStarterPackPool,
  defaultPool = defaultScoutPool,
  purchased,
  supply,
  scoutsRewardPool
}: {
  developerPool?: number;
  starterPackPool?: number;
  defaultPool?: number;
  purchased: { starterPack?: number; default?: number };
  supply: { starterPack: number; default: number };
  scoutsRewardPool: bigint;
}): bigint {
  // sanity check
  if (defaultPool + developerPool + starterPackPool !== 100) {
    throw new Error(
      `Pool percentages must add up to 1. Developer pool: ${developerPool}, starter pack pool: ${starterPackPool}, default pool: ${defaultPool}`
    );
  }
  if (purchased.default && purchased.default > supply.default) {
    throw new Error(`Purchased default NFTs: ${purchased.default} is greater than supply: ${supply.default}`);
  }
  if (purchased.starterPack && starterPackPool === 0) {
    log.debug('Returning 0 for starter pack reward because starter pack pool is 0');
    return BigInt(0);
  }
  if (purchased.starterPack && purchased.starterPack > supply.starterPack) {
    throw new Error(
      `Purchased starter pack NFTs: ${purchased.starterPack} is greater than supply: ${supply.starterPack}`
    );
  }

  const shareOfDefault = supply.default <= 0 ? 0 : (purchased.default ?? 0) / supply.default;
  const shareOfStarter = supply.starterPack <= 0 ? 0 : (purchased.starterPack ?? 0) / supply.starterPack;
  return BigInt(shareOfDefault * (defaultPool / 100) + shareOfStarter * (starterPackPool / 100)) * scoutsRewardPool;
}
