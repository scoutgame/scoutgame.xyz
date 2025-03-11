import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getLastWeek } from '@packages/dates/utils';
import { getPointsCountForWeekWithNormalisation } from '@packages/scoutgame/points/getPointsCountForWeekWithNormalisation';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

import { sendGemsPayoutNotifications } from '../../notifications/sendGemsPayoutNotifications';

import { deployNewScoutRewardsContract } from './deployNewScoutRewardsContract';
import { deployOctantBasePartnerRewards } from './deployOctantBasePartnerRewards';
import { deployReferralChampionRewardsContract } from './deployReferralRewardsContract';
import { processScoutPointsPayout } from './processScoutPointsPayout';

const log = getLogger('cron-process-gems-payout');

export async function processGemsPayout(ctx: Context, { now = DateTime.utc() }: { now?: DateTime } = {}) {
  const week = getLastWeek(now);
  const season = getCurrentSeason(week).start;

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const existingPayoutCount = await prisma.builderEvent.count({
    where: {
      week,
      type: 'gems_payout'
    }
  });

  if (existingPayoutCount > 0) {
    log.info('Gems Payout: Payout already exists for this week, skipping');
    return;
  }

  const { normalisationFactor, topWeeklyBuilders, totalPoints, weeklyAllocatedPoints } =
    await getPointsCountForWeekWithNormalisation({ week });

  log.debug(`Allocation: ${weeklyAllocatedPoints} -- Total points for week ${week}: ${totalPoints}`, {
    topWeeklyBuilders: topWeeklyBuilders.length,
    week,
    season,
    normalisationFactor,
    totalPoints,
    allocatedPoints: weeklyAllocatedPoints
  });

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      log.info(`Processing scout points payout for builder ${builder.id}`);
      await processScoutPointsPayout({
        builderId: builder.id,
        rank,
        gemsCollected,
        week,
        season,
        normalisationFactor,
        weeklyAllocatedPoints
      });
    } catch (error) {
      log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  await Promise.all([
    deployReferralChampionRewardsContract({ week }).catch((error) => {
      log.error('Error deploying referral champion rewards contract', { error, week, season });
    }),
    deployOctantBasePartnerRewards({ week }).catch((error) => {
      log.error('Error deploying octant & base partner rewards contract', { error, week, season });
    })
  ]);

  await prisma.weeklyClaims.upsert({
    where: {
      week
    },
    create: {
      merkleTreeRoot: '',
      proofsMap: {},
      season,
      claims: [],
      totalClaimable: totalPoints,
      week
    },
    update: {}
  });

  const notificationsSent = await sendGemsPayoutNotifications({ week });

  log.info(`Processed ${topWeeklyBuilders.length} builders points payout`, { notificationsSent });
}
