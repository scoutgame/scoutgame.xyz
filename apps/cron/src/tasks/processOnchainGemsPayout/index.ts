import { getCurrentSeasonStart, getLastWeek, getSeasonConfig } from '@packages/dates/utils';
import { calculateWeeklyClaims } from '@packages/scoutgame/protocol/calculateWeeklyClaims';
import { scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { generateWeeklyClaims } from '@packages/scoutgame/protocol/generateWeeklyClaims';
import { resolveTokenOwnership } from '@packages/scoutgame/protocol/resolveTokenOwnership';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

import { sendGemsPayoutNotifications } from '../../notifications/sendGemsPayoutNotifications';

import { deployGooddollarPartnerRewards } from './deployGooddollarPartnerRewards';
import { deployMatchupRewards } from './deployMatchupRewards';
import { deployReferralChampionRewardsContract } from './deployReferralRewardsContract';
import { log } from './logger';

export { log };

export async function processOnchainGemsPayout(
  ctx: Context,
  { season = getCurrentSeasonStart(), now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);
  const seasonConfig = getSeasonConfig(season);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }
  if (!seasonConfig.draft) {
    const tokenBalances = await resolveTokenOwnership({
      chainId: scoutProtocolChainId,
      week
    });

    const weeklyClaimsCalculated = await calculateWeeklyClaims({
      week,
      tokenBalances
    });

    const generatedClaims = await generateWeeklyClaims({ week, weeklyClaimsCalculated });

    log.info(`Processed ${generatedClaims.totalDevelopers} developers points payout`, {
      totalDevelopers: generatedClaims.totalDevelopers
    });

    const notificationsSent = await sendGemsPayoutNotifications({ week });
    log.info(`Sent notifications for ${notificationsSent} developers`, { notificationsSent });
  }

  await Promise.all([
    deployMatchupRewards({ week }).catch((error) => {
      log.error('Error deploying matchup rewards', { error, week, season });
    }),
    deployReferralChampionRewardsContract({ week }).catch((error) => {
      log.error('Error deploying referral champion rewards contract', { error, week, season });
    }),
    deployGooddollarPartnerRewards({ week }).catch((error) => {
      log.error('Error deploying gooddollar partner rewards contract', { error, week, season });
    })
  ]);
}
