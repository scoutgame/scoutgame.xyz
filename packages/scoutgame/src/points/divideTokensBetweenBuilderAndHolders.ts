import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { Address } from 'viem';

import type { TokenOwnershipForBuilder } from '../protocol/resolveTokenOwnershipForBuilder';

import { calculateEarnableScoutPointsForRank as calculateEarnableScoutTokensForRank } from './calculatePoints';

// percent of rewards that go to the builder
export const defaultBuilderPool = 0.2;
export const defaultStarterPackPool = 0.1;

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
    const scoutReward = calculateRewardForScout({
      builderPool: defaultBuilderPool,
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply },
      scoutsRewardPool: earnableScoutTokens
    });
    const scoutTokens = Math.floor(scoutReward);
    return { wallet: owner.wallet, nftTokens: owner.totalNft, erc20Tokens: scoutTokens };
  });

  const tokensPerScoutByScoutId = owners.byScoutId.map((owner) => {
    const scoutReward = calculateRewardForScout({
      builderPool: defaultBuilderPool,
      purchased: { default: owner.totalNft, starterPack: owner.totalStarter },
      supply: { default: nftSupply, starterPack: starterPackSupply },
      scoutsRewardPool: earnableScoutTokens
    });
    const scoutTokens = Math.floor(scoutReward);

    return { scoutId: owner.scoutId, nftTokens: owner.totalNft, erc20Tokens: scoutTokens };
  });

  const tokensForBuilder = Math.floor(defaultBuilderPool * earnableScoutTokens);

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
  builderPool = defaultBuilderPool,
  starterPackPool = defaultStarterPackPool,
  purchased,
  supply,
  scoutsRewardPool
}: {
  builderPool?: number;
  starterPackPool?: number;
  purchased: { starterPack?: number; default?: number };
  supply: { starterPack: number; default: number };
  scoutsRewardPool: number;
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
  if (purchased.default && purchased.default > supply.default) {
    throw new Error(`Purchased default NFTs: ${purchased.default} is greater than supply: ${supply.default}`);
  }
  if (purchased.starterPack && starterPackPool === 0) {
    log.debug('Returning 0 for starter pack reward because starter pack pool is 0');
    return 0;
  }
  if (purchased.starterPack && purchased.starterPack > supply.starterPack) {
    throw new Error(
      `Purchased starter pack NFTs: ${purchased.starterPack} is greater than supply: ${supply.starterPack}`
    );
  }

  const shareOfDefault = supply.default <= 0 ? 0 : (purchased.default ?? 0) / supply.default;
  const shareOfStarterPack = supply.starterPack <= 0 ? 0 : (purchased.starterPack ?? 0) / supply.starterPack;
  // Note: do as much multiplication as possible in one line to avoid precision loss
  return (shareOfDefault * defaultPool + shareOfStarterPack * starterPackPool) * scoutsRewardPool;
}
