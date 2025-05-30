import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';

import type { TokenOwnershipForBuilder } from '../protocol/resolveTokenOwnershipForBuilder';

import { calculateEarnableTokensForRank } from './calculateTokens';

// percent that goes to the developer
export const developerPool = parseUnits('20', 18);
// go to owners of starter pack
export const starterNftPool = parseUnits('10', 18);
// go to owners of default NFTs
export const defaultNftPool = parseUnits('70', 18);

export const poolScale = parseUnits('100', 18);

export type TokenDistribution = {
  nftSupply: {
    default: number;
    starterPack: number;
    total: number;
  };
  earnableTokens: bigint;
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
  normalisationScale,
  owners
}: {
  rank: number;
  weeklyAllocatedTokens: bigint;
  normalisationFactor: bigint;
  normalisationScale: bigint;
  owners: Pick<TokenOwnershipForBuilder, 'byScoutId'>;
}): TokenDistribution {
  if (rank < 1 || typeof rank !== 'number') {
    throw new InvalidInputError('Invalid rank provided. Must be a number greater than 0');
  }

  // Calculate the total number of NFTs purchased by each scout
  const nftSupply = owners.byScoutId.reduce((acc, owner) => acc + owner.totalNft, 0);
  const starterSupply = owners.byScoutId.reduce((acc, owner) => acc + owner.totalStarter, 0);

  const earnableTokens =
    (calculateEarnableTokensForRank({ rank, weeklyAllocatedTokens }) * normalisationFactor) / normalisationScale;

  const tokensPerScoutByScoutId = owners.byScoutId.map((owner) => {
    const scoutReward = calculateRewardForScout({
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterSupply },
      scoutsRewardPool: earnableTokens
    });

    return { scoutId: owner.scoutId, nftTokens: owner.totalNft, erc20Tokens: scoutReward };
  });

  const tokensForDeveloper = (earnableTokens * developerPool) / poolScale;

  return {
    nftSupply: {
      default: nftSupply,
      starterPack: starterSupply,
      total: nftSupply + starterSupply
    },
    earnableTokens,
    tokensPerScoutByScoutId,
    tokensForDeveloper
  };
}

// Returns the total weekly rewards that a scout should receive
// Note: We use whole numbers for pools to avoid issues with addition and subtraction of floating point numbers
export function calculateRewardForScout({
  devPool = developerPool,
  starterPackPool = starterNftPool,
  defaultPool = defaultNftPool,
  purchased,
  supply,
  scoutsRewardPool
}: {
  devPool?: bigint;
  starterPackPool?: bigint;
  defaultPool?: bigint;
  purchased: { starterPack?: number; default?: number };
  supply: { starterPack: number; default: number };
  scoutsRewardPool: bigint;
}): bigint {
  // sanity check
  if (defaultPool + devPool + starterPackPool !== poolScale) {
    throw new Error(
      `Pool percentages must add up to ${formatUnits(poolScale, 18)}. Developer pool: ${formatUnits(devPool, 18)}, starter pack pool: ${formatUnits(starterPackPool, 18)}, default pool: ${formatUnits(defaultPool, 18)}`
    );
  }
  if (purchased.default && purchased.default > supply.default) {
    throw new Error(`Purchased default NFTs: ${purchased.default} is greater than supply: ${supply.default}`);
  }
  if (purchased.starterPack && starterPackPool === BigInt(0)) {
    log.debug('Returning 0 for starter pack reward because starter pack pool is 0');
    return BigInt(0);
  }
  if (purchased.starterPack && purchased.starterPack > supply.starterPack) {
    throw new Error(
      `Purchased starter pack NFTs: ${purchased.starterPack} is greater than supply: ${supply.starterPack}`
    );
  }

  const shareScale = BigInt(10 ** 18);
  const shareOfDefault = supply.default <= 0 ? 0 : (purchased.default ?? 0) / supply.default;
  const shareOfDefaultBigInt = BigInt(shareOfDefault * 10 ** 18);
  const tokensFromDefault = (scoutsRewardPool * shareOfDefaultBigInt * defaultPool) / poolScale / shareScale;
  const shareOfStarter = supply.starterPack <= 0 ? 0 : (purchased.starterPack ?? 0) / supply.starterPack;
  const shareOfStarterBigInt = BigInt(shareOfStarter * 10 ** 18);
  const tokensFromStarter = (scoutsRewardPool * shareOfStarterBigInt * starterPackPool) / poolScale / shareScale;
  return tokensFromDefault + tokensFromStarter;
}
