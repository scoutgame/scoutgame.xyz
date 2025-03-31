import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getNextWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';

// scouts can only register for a matchup in the next week, unless it is Monday of the current week
export function isValidRegistrationWeek(week: number) {
  const currentWeek = getCurrentWeek();
  const nextWeek = getNextWeek(currentWeek);
  const currentDay = DateTime.utc().weekday;
  return currentDay === 1 ? week === currentWeek : week === nextWeek;
}

export async function registerForMatchup(scoutId: string, week: number) {
  return prisma.scoutMatchup.create({
    data: {
      createdBy: scoutId,
      week
    }
  });
}
