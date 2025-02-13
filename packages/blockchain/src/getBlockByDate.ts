import { log } from '@charmverse/core/log';

import { getPublicClient } from './getPublicClient';

export async function getBlockByDate({ date, chainId }: { date: Date; chainId: number }) {
  const dateTimestamp = Math.floor(date.getTime() / 1000);

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

    if (block.timestamp < dateTimestamp) {
      low = mid + 1;
    } else if (block.timestamp > dateTimestamp) {
      high = mid - 1;
    } else {
      resultBlock = block;
      break;
    }

    resultBlock = block; // Store the latest "best match" block
  }

  return resultBlock;
}
// keep track of the window start per chain and date, so we reduce lookups
let blockNumbersByDate: Record<string, Record<string, bigint>> = {};

export async function getBlockNumberByDateCached({ date, chainId }: { date: Date; chainId: number }) {
  const dateKey = date.toISOString();

  if (!blockNumbersByDate[chainId]) {
    blockNumbersByDate[chainId] = {};
  }

  if (!blockNumbersByDate[chainId][dateKey]) {
    // Clear cache if total entries across all chains exceeds 1000
    const totalEntries = Object.values(blockNumbersByDate).reduce(
      (sum, chainCache) => sum + Object.keys(chainCache).length,
      0
    );
    if (totalEntries > 1000) {
      log.debug('Clearing block numbers by date cache');
      blockNumbersByDate = {};
    }

    // retrieve the block number
    blockNumbersByDate[chainId][dateKey] = (await getBlockByDate({ date, chainId })).number;
  }
  return blockNumbersByDate[chainId][dateKey];
}
