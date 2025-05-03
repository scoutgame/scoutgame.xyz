import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
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
  lastBlock
}: {
  contractAddress: Address;
  lastBlock: number;
}): Promise<TokenOwnership[keyof TokenOwnership]> {
  const allEvents = await getTransferSingleWithBatchMerged({
    // These from number correspond to the earliest activity ranges for our NFTs
    fromBlock: 27_250_000,
    toBlock: lastBlock,
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
  const lastBlock = await getLastBlockOfWeek({ week, chainId });
  const standardNftContractAddress = getNFTContractAddress(week);
  const starterNftContractAddress = getStarterNFTContractAddress(week);

  const standardTokenOwnership = await getTokenOwnershipForContract({
    contractAddress: standardNftContractAddress as Address,
    lastBlock
  });

  const starterTokenOwnership = await getTokenOwnershipForContract({
    contractAddress: starterNftContractAddress as Address,
    lastBlock
  });

  return {
    standard: standardTokenOwnership,
    starter: starterTokenOwnership
  };
}
