import { prisma } from '@charmverse/core/prisma-client';
import { getNextWeek, getWeekFromDate } from '@packages/dates/utils';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { DateTime } from 'luxon';

import { REGISTRATION_DAY_OF_WEEK, MATCHUP_REGISTRATION_FEE } from './config';

// scouts can only register for a matchup in the next week, unless it is Monday of the current week
export function isValidRegistrationWeek(week: string, now = DateTime.utc()) {
  const currentWeek = getWeekFromDate(now.toJSDate());
  const nextWeek = getNextWeek(currentWeek);
  const currentDay = now.weekday;
  return currentDay === REGISTRATION_DAY_OF_WEEK ? week === currentWeek : week === nextWeek;
}

export async function registerForMatchup(scoutId: string, week: string) {
  await sendPointsForMiscEvent({
    builderId: scoutId,
    points: -1 * MATCHUP_REGISTRATION_FEE,
    description: 'Matchup registration fee',
    claimed: true,
    hideFromNotifications: true
  });
  return prisma.scoutMatchup.create({
    data: {
      createdBy: scoutId,
      week
    }
  });
}
