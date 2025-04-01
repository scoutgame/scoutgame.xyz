import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getNextWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';

import { REGISTRATION_DAY_OF_WEEK } from './config';

// scouts can only register for a matchup in the next week, unless it is Monday of the current week
export function isValidRegistrationWeek(week: string) {
  const currentWeek = getCurrentWeek();
  const nextWeek = getNextWeek(currentWeek);
  const currentDay = DateTime.utc().weekday;
  return currentDay === REGISTRATION_DAY_OF_WEEK ? week === currentWeek : week === nextWeek;
}

export async function registerForMatchup(scoutId: string, week: string) {
  return prisma.scoutMatchup.create({
    data: {
      createdBy: scoutId,
      week
    }
  });
}
