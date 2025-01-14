import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getDateFromISOWeek, getWeekStartEnd } from '@packages/dates/utils';

export async function getLastBlockOfWeek({ week, chainId }: { week: string; chainId: number }): Promise<number> {
  // Step 1: Parse the ISO week (e.g., '2024-W50') and calculate the end of the week (Sunday 23:59:59 UTC)

  const weekInfo = getWeekStartEnd(getDateFromISOWeek(week).toJSDate());

  const sundayEndUTC = Math.floor(weekInfo.end.toUTC().toSeconds());

  log.info(`Last Sunday UTC at 23:59:59 timestamp: ${sundayEndUTC})`);

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

    if (block.timestamp < sundayEndUTC) {
      low = mid + 1;
    } else if (block.timestamp > sundayEndUTC) {
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
