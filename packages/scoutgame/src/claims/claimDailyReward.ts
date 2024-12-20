import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { getCurrentWeek, getPreviousWeek, currentSeason } from '@packages/scoutgame/dates';
import { sendPointsForDailyClaim } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaim';
import { sendPointsForDailyClaimStreak } from '@packages/scoutgame/points/builderEvents/sendPointsForDailyClaimStreak';

import { getRandomReward } from './getRandomReward';

export async function claimDailyReward({
  userId,
  isBonus,
  dayOfWeek,
  week = getCurrentWeek(),
  season = currentSeason
}: {
  userId: string;
  isBonus?: boolean;
  dayOfWeek: number;
  week?: string;
  season?: string;
}) {
  const validWeeks = [getCurrentWeek(), getPreviousWeek(getCurrentWeek())];
  if (!validWeeks.includes(week)) {
    throw new Error(`Invalid week: ${week}. Valid weeks are ${validWeeks.join(', ')}`);
  }
  if (dayOfWeek !== 7 && isBonus) {
    throw new Error('Bonus reward can only be claimed on the last day of the week');
  }

  const points = getRandomReward(isBonus);

  if (isBonus) {
    const existingEvent = await prisma.scoutDailyClaimStreakEvent.findFirst({
      where: {
        userId,
        week
      }
    });

    if (existingEvent) {
      throw new Error('Daily reward streak already claimed');
    }

    const existingEvents = await prisma.scoutDailyClaimEvent.findMany({
      where: {
        userId,
        week
      }
    });

    if (existingEvents.length < 7) {
      throw new Error('You must claim all 7 days of the week to get the bonus reward');
    }

    await sendPointsForDailyClaimStreak({
      builderId: userId,
      week,
      season,
      points
    });
    trackUserAction('daily_claim_streak', {
      userId
    });
  } else {
    const existingEvent = await prisma.scoutDailyClaimEvent.findFirst({
      where: {
        userId,
        week,
        dayOfWeek
      }
    });

    if (existingEvent) {
      throw new Error('Daily reward already claimed');
    }

    await sendPointsForDailyClaim({
      builderId: userId,
      dayOfWeek,
      week,
      season,
      points
    });
    trackUserAction('daily_claim', {
      userId
    });
  }

  return { points };
}
