import { getLastBlockOfWeek } from '@packages/blockchain/getLastBlockOfWeek';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getCurrentWeek, getSeasonConfig } from '@packages/dates/utils';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { getTransferSingleWithBatchMerged } from '../builderNfts/accounting/getTransferSingleWithBatchMerged';
import { getNFTContractAddress, getStarterNFTContractAddress, nftChain } from '../builderNfts/constants';

// tokenId, balance
type TokenBalances = Record<string, number>;

async function getTokensByOwner({
  contractAddress,
  wallet,
  fromBlock = 27_250_000, // These from number correspond to the earliest activity ranges for our NFTs
  toBlock
}: {
  contractAddress: Address;
  wallet: Address;
  fromBlock?: number;
  toBlock: number;
}): Promise<TokenBalances> {
  const walletLowerCase = wallet.toLowerCase();

  const allEvents = await getTransferSingleWithBatchMerged({
    // These from number correspond to the earliest activity ranges for our NFTs
    fromBlock,
    toBlock,
    chainId: base.id,
    contractAddress
  });

  // Create a mapping of tokenId -> wallet -> amount
  const tokensHeld: TokenBalances = {};
  // Process each transfer event chronologically to build up ownership state
  for (const event of allEvents) {
    const { from, to, id, value } = event.args;

    const idString = id.toString();

    if (from.toLowerCase() !== walletLowerCase && to.toLowerCase() !== walletLowerCase) {
      continue;
    }

    // Subtract tokens from sender (if not minting)
    if (from.toLowerCase() === walletLowerCase) {
      const currentBalance = tokensHeld[idString] || 0;
      const newBalance = currentBalance - Number(value);
      if (newBalance === 0) {
        delete tokensHeld[idString];
      } else {
        tokensHeld[idString] = newBalance;
      }
    }

    // Add tokens to receiver (if not burning)
    if (to.toLowerCase() === walletLowerCase) {
      const currentBalance = tokensHeld[idString] || 0;
      tokensHeld[idString] = currentBalance + Number(value);
    }
  }

  return tokensHeld;
}

export async function getNftsByOwner({
  week = getCurrentWeek(),
  wallet,
  chainId = nftChain.id
}: {
  week?: ISOWeek;
  wallet: Address;
  chainId?: number;
}): Promise<{ starter: TokenBalances; standard: TokenBalances }> {
  const toBlock = await getLastBlockOfWeek({ week, chainId });
  const season = getCurrentSeasonStart(week);
  const seasonConfig = getSeasonConfig(season);
  const standardNftContractAddress = getNFTContractAddress(season);
  const starterNftContractAddress = getStarterNFTContractAddress(season);

  const standardTokenBalances = await getTokensByOwner({
    contractAddress: standardNftContractAddress as Address,
    wallet,
    fromBlock: seasonConfig.nftBlockNumber,
    toBlock
  });

  const starterTokenBalances = await getTokensByOwner({
    contractAddress: starterNftContractAddress as Address,
    wallet,
    fromBlock: seasonConfig.nftBlockNumber,
    toBlock
  });

  return {
    standard: standardTokenBalances,
    starter: starterTokenBalances
  };
}
