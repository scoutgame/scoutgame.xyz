import { log } from '@charmverse/core/log';
import { getDateFromISOWeek, getWeekStartEnd } from '@packages/dates/utils';

import { getBlockByDate } from './getBlockByDate';

export async function getLastBlockOfWeek({ week, chainId }: { week: string; chainId: number }): Promise<number> {
  // Step 1: Parse the ISO week (e.g., '2024-W50') and calculate the end of the week (Sunday 23:59:59 UTC)

  const { end: endOfWeek } = getWeekStartEnd(getDateFromISOWeek(week).toJSDate());

  const block = await getBlockByDate({ date: endOfWeek.toJSDate(), chainId });

  log.debug(
    `Found block for end of the week: ${block.timestamp} (Date: ${new Date(Number(block.timestamp) * 1000).toUTCString()})`,
    { block: block.number }
  );

  return Number(block.number);
}
