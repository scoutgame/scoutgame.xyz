import { prisma } from '@charmverse/core/prisma-client';
import { seasons } from '@packages/scoutgame/dates/config';
import { getCurrentSeasonStart, getCurrentWeek, getLastWeek } from '@packages/scoutgame/dates/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { getWeeklyPointsPoolAndBuilders } from '@packages/scoutgame/points/getWeeklyPointsPoolAndBuilders';
import { questsRecord } from '@packages/scoutgame/quests/questRecords';
import type { Context } from 'koa';
import { DateTime } from 'luxon';

import { sendGemsPayoutEmails } from '../../emails/sendGemsPayoutEmails';

import { processScoutPointsPayout } from './processScoutPointsPayout';

export async function processGemsPayout(
  ctx: Context,
  { season = getCurrentSeasonStart(), now = DateTime.utc() }: { season?: string; now?: DateTime } = {}
) {
  const week = getLastWeek(now);

  // run for the first few hours every Monday at midnight UTC
  if (now.weekday !== 1 || now.hour > 3) {
    scoutgameMintsLogger.info('Gems Payout: It is not yet Sunday at 12:00 AM UTC, skipping');
    return;
  }

  const existingPayoutCount = await prisma.builderEvent.count({
    where: {
      week,
      type: 'gems_payout'
    }
  });

  if (existingPayoutCount > 0) {
    scoutgameMintsLogger.info('Gems Payout: Payout already exists for this week, skipping');
    return;
  }

  const { normalisationFactor, topWeeklyBuilders, totalPoints, weeklyAllocatedPoints, nftPurchaseEvents } =
    await getWeeklyPointsPoolAndBuilders({ week, season });

  scoutgameMintsLogger.debug(`Allocation: ${weeklyAllocatedPoints} -- Total points for week ${week}: ${totalPoints}`, {
    topWeeklyBuilders: topWeeklyBuilders.length,
    week,
    season,
    normalisationFactor,
    totalPoints,
    allocatedPoints: weeklyAllocatedPoints
  });

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      scoutgameMintsLogger.info(`Processing scout points payout for builder ${builder.id}`);
      await processScoutPointsPayout({
        builderId: builder.id,
        rank,
        gemsCollected,
        week,
        season,
        normalisationFactor,
        weeklyAllocatedPoints,
        nftPurchaseEvents
      });
    } catch (error) {
      scoutgameMintsLogger.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  const emailsSent = await sendGemsPayoutEmails({ week });

  scoutgameMintsLogger.info(`Processed ${topWeeklyBuilders.length} builders points payout`, { emailsSent });

  const currentWeek = getCurrentWeek();

  const preseason2Start = seasons.find((d) => d.title === 'Season 2')?.start;
  const preseason1Start = seasons.find((d) => d.title === 'Season 1')?.start;

  if (currentWeek === preseason2Start && preseason1Start) {
    await prisma.$transaction(async (tx) => {
      await tx.scout.updateMany({
        data: {
          currentBalance: 0
        }
      });
      await tx.pointsReceipt.updateMany({
        where: {
          season: preseason1Start
        },
        data: {
          claimedAt: new Date()
        }
      });
      await tx.scoutSocialQuest.deleteMany({
        where: {
          type: {
            notIn: Object.entries(questsRecord)
              .filter(([_, q]) => q.resettable)
              .map(([type]) => type)
          }
        }
      });
    });
  }
}
