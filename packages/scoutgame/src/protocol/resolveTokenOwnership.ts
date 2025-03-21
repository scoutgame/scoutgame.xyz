import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
import type { Address } from 'viem';
import { base, baseSepolia, optimism } from 'viem/chains';

import { getTransferSingleWithBatchMerged } from '../builderNfts/accounting/getTransferSingleWithBatchMerged';
/**
 * TokenOwnership is a mapping of tokenId -> wallet -> amount
 */
export type TokenOwnership = Record<string, Record<Address, number>>;

export async function resolveTokenOwnership({
  week,
  chainId,
  contractAddress
}: {
  week: ISOWeek;
  chainId: number;
  contractAddress: Address;
}): Promise<TokenOwnership> {
  const lastBlock = await getLastBlockOfWeek({ week, chainId });

  const allEvents = await getTransferSingleWithBatchMerged({
    // These from number correspond to the earliest activity ranges for our NFTs
    fromBlock:
      chainId === baseSepolia.id
        ? 19_000_000
        : chainId === base.id
          ? // TODO: Change the block number once the nft contract is deployed
            27_250_000
          : chainId === optimism.id
            ? 126_000_000
            : 1,
    toBlock: lastBlock,
    chainId,
    contractAddress
  });
  // Create a mapping of tokenId -> wallet -> amount
  const tokenOwnership: TokenOwnership = {};

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
