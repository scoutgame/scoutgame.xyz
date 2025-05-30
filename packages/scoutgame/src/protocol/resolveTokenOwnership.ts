import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getSeasonConfig } from '@packages/dates/utils';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { getTransferSingleWithBatchMerged } from '../builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getNFTContractAddress, getStarterNFTContractAddress } from '../builderNfts/constants';
/**
 * TokenOwnership is a mapping of tokenId -> wallet -> amount
 */
export type TokenOwnership = {
  starter: Record<string, Record<Address, number>>;
  standard: Record<string, Record<Address, number>>;
};

async function getTokenOwnershipForContract({
  contractAddress,
  fromBlock = 27_250_000,
  toBlock
}: {
  contractAddress: Address;
  fromBlock?: number;
  toBlock: number;
}): Promise<TokenOwnership[keyof TokenOwnership]> {
  const allEvents = await getTransferSingleWithBatchMerged({
    fromBlock,
    toBlock,
    chainId: base.id,
    contractAddress
  });
  // Create a mapping of tokenId -> wallet -> amount
  const tokenOwnership: TokenOwnership['starter'] = {};

  // Process each transfer event chronologically to build up ownership state
  for (const event of allEvents) {
    const { from, to, id, value } = event.args;

    // Initialize objects if they don't exist
    if (!tokenOwnership[id.toString()]) {
      tokenOwnership[id.toString()] = {};
    }
    const ownershipForToken = tokenOwnership[id.toString()];

    // Subtract tokens from sender (if not minting)
    if (from !== NULL_EVM_ADDRESS) {
      const currentFromBalance = ownershipForToken[from.toLowerCase() as Address] || 0;
      const newFromBalance = currentFromBalance - Number(value);
      if (newFromBalance === 0) {
        delete ownershipForToken[from.toLowerCase() as Address];
      } else {
        ownershipForToken[from.toLowerCase() as Address] = newFromBalance;
      }
    }

    // Add tokens to receiver (if not burning)
    if (to !== NULL_EVM_ADDRESS) {
      const currentToBalance = ownershipForToken[to.toLowerCase() as Address] || 0;
      ownershipForToken[to.toLowerCase() as Address] = currentToBalance + Number(value);
    }
  }

  return tokenOwnership;
}

export async function resolveTokenOwnership({
  week,
  chainId
}: {
  week: ISOWeek;
  chainId: number;
}): Promise<TokenOwnership> {
  const toBlock = await getLastBlockOfWeek({ week, chainId });
  const season = getCurrentSeasonStart(week);
  const seasonConfig = getSeasonConfig(season);
  const standardNftContractAddress = getNFTContractAddress(season);
  const starterNftContractAddress = getStarterNFTContractAddress(season);

  const standardTokenOwnership = await getTokenOwnershipForContract({
    contractAddress: standardNftContractAddress as Address,
    fromBlock: seasonConfig.nftBlockNumber,
    toBlock
  });

  const starterTokenOwnership = await getTokenOwnershipForContract({
    contractAddress: starterNftContractAddress as Address,
    fromBlock: seasonConfig.nftBlockNumber,
    toBlock
  });

  return {
    standard: standardTokenOwnership,
    starter: starterTokenOwnership
  };
}
