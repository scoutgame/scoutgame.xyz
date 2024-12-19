import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { baseSepolia, optimism } from 'viem/chains';

import { getTransferSingleWithBatchMerged } from '../builderNfts/accounting/getTransferSingleWithBatchMerged';
import type { ISOWeek } from '../dates';

async function getLastBlockOfWeek({ week, chainId }: { week: string; chainId: number }): Promise<number> {
  // Step 1: Parse the ISO week (e.g., '2024-W50') and calculate the end of the week (Sunday 23:59:59 UTC)
  const lastSundayUTC = getEndDateOfISOWeek(week);
  const targetTimestamp = Math.floor(lastSundayUTC.getTime() / 1000); // Convert to Unix timestamp (seconds)

  log.info(`Last Sunday UTC at 23:59:59 timestamp: ${targetTimestamp} (Date: ${lastSundayUTC.toUTCString()})`);

  // Step 2: Get the public client for the chain
  const client = getPublicClient(chainId);

  // Get the current latest block
  const blockNumber = await client.getBlockNumber();
  const latestBlock = await client.getBlock({ blockNumber });

  // Step 3: Binary search for the block closest to the target timestamp
  let low = 0;
  let high = Number(blockNumber);
  let resultBlock = latestBlock;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const block = await client.getBlock({ blockNumber: BigInt(mid) });

    if (block.timestamp < targetTimestamp) {
      low = mid + 1;
    } else if (block.timestamp > targetTimestamp) {
      high = mid - 1;
    } else {
      resultBlock = block;
      break;
    }

    resultBlock = block; // Store the latest "best match" block
  }

  log.info(
    `Found block at ${resultBlock.timestamp} (Date: ${new Date(Number(resultBlock.timestamp) * 1000).toUTCString()})`
  );
  log.info(`Block Number: ${resultBlock.number}`);

  return Number(resultBlock.number);
}

/**
 * Calculates the end date (Sunday 23:59:59 UTC) of the given ISO week (YYYY-Www).
 * @param week - The ISO week in the format 'YYYY-Www' (e.g., '2024-W50').
 * @returns A Date object set to Sunday 23:59:59 UTC of that ISO week.
 */
function getEndDateOfISOWeek(week: string): Date {
  const [year, weekNumber] = week.split('-W').map(Number);

  // Calculate the start of the ISO week (Monday 00:00:00 UTC)
  const firstDayOfYear = new Date(Date.UTC(year, 0, 4)); // ISO week starts near Jan 4th
  const firstISOWeekMonday = new Date(firstDayOfYear);
  const dayOfWeek = firstDayOfYear.getUTCDay();

  // Adjust to previous Monday (day 1 of ISO week)
  firstISOWeekMonday.setUTCDate(firstISOWeekMonday.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // Calculate the start of the given ISO week (add 7 days for each week)
  const startOfWeek = new Date(firstISOWeekMonday);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() + (weekNumber - 1) * 7);

  // Calculate the end of the week (Sunday 23:59:59 UTC)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Move to Sunday
  endOfWeek.setUTCHours(23, 59, 59, 999); // 23:59:59.999 UTC

  return endOfWeek;
}

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
    fromBlock: chainId === baseSepolia.id ? 19_000_000 : chainId === optimism.id ? 126_000_000 : 1,
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
    if (from !== '0x0000000000000000000000000000000000000000') {
      const currentFromBalance = ownershipForToken[from.toLowerCase() as Address] || 0;
      const newFromBalance = currentFromBalance - Number(value);
      if (newFromBalance === 0) {
        delete ownershipForToken[from.toLowerCase() as Address];
      } else {
        ownershipForToken[from.toLowerCase() as Address] = newFromBalance;
      }
    }

    // Add tokens to receiver (if not burning)
    if (to !== '0x0000000000000000000000000000000000000000') {
      const currentToBalance = ownershipForToken[to.toLowerCase() as Address] || 0;
      ownershipForToken[to.toLowerCase() as Address] = currentToBalance + Number(value);
    }
  }

  return tokenOwnership;
}
