import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { weeklyRewardableBuilders } from '@packages/scoutgame/builderNfts/constants';
import { currentSeason, getLastWeek, weeklyAllocatedPoints } from '@packages/scoutgame/dates';
import { getBuildersLeaderboard } from '@packages/scoutgame/getBuildersLeaderboard';
import { getPointsCountForWeekWithNormalisation } from '@packages/scoutgame/points/getPointsCountForWeekWithNormalisation';
import { DateTime } from 'luxon';

import { processScoutPointsPayout } from './processScoutPointsPayout';

export async function processGemsPayout() {
  const now = DateTime.utc();
  const week = getLastWeek();

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    log.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const existingPayout = await prisma.scoutGamePayout.findFirst({
    where: {
      week,
      season: currentSeason
    }
  });

  if (existingPayout) {
    log.info('Gems Payout: Payout already exists for this week, skipping');
    return;
  }
  const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week });

  const { normalisationFactor, totalPoints } = await getPointsCountForWeekWithNormalisation({ week });

  log.info(
    `Allocation: ${weeklyAllocatedPoints} -- Total points for week ${week}: ${totalPoints} -- Normalisation factor: ${normalisationFactor}`,
    {
      weeklyPayoutParams: {
        week,
        season: currentSeason,
        normalisationFactor,
        totalPoints,
        allocatedPoints: weeklyAllocatedPoints
      }
    }
  );

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      log.info(`Processing scout points payout for builder ${builder.id}`);
      await processScoutPointsPayout({
        builderId: builder.id,
        rank,
        gemsCollected,
        week,
        season: currentSeason,
        normalisationFactor
      });
    } catch (error) {
      log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  log.info(`Processed ${topWeeklyBuilders.length} builders points payout`);
}
