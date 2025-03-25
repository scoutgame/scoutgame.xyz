import { getLogger } from '@charmverse/core/log';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { calculateWeeklyClaims } from '@packages/scoutgame/protocol/calculateWeeklyClaims';
import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { generateWeeklyClaims } from '@packages/scoutgame/protocol/generateWeeklyClaims';
import { resolveTokenOwnership } from '@packages/scoutgame/protocol/resolveTokenOwnership';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

const log = getLogger('cron-process-onchain-gems-payout');

export async function processOnchainGemsPayout(
  ctx: Context,
  { season = getCurrentSeasonStart(), now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const tokenBalances = await resolveTokenOwnership({
    chainId: scoutProtocolChainId,
    contractAddress: scoutProtocolBuilderNftContractAddress,
    week
  });

  const weeklyClaimsCalculated = await calculateWeeklyClaims({
    week,
    tokenBalances
  });

  const generatedClaims = await generateWeeklyClaims({ week, weeklyClaimsCalculated });

  log.info(`Processed ${generatedClaims.totalBuilders} builders points payout`, {
    totalBuilders: generatedClaims.totalBuilders
  });
}
