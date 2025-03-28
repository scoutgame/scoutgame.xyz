import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonWeekNumber, dateTimeToWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';

import { MATCHUP_REGISTRATION_POOL, MATCHUP_OP_PRIZE } from './config';
// get the next week, unless it is monday. then use the current week
export function getNextMatchupWeek(now = DateTime.utc()) {
  const dayOfWeek = now.weekday;
  if (dayOfWeek === 1) {
    return dateTimeToWeek(now);
  }
  return dateTimeToWeek(now.plus({ weeks: 1 }));
}

export async function getNextMatchup() {
  const nextWeek = getNextMatchupWeek();
  const matchups = await prisma.scoutMatchUp.count({
    where: {
      week: nextWeek
    }
  });
  const weekNumber = getCurrentSeasonWeekNumber(nextWeek);
  return {
    week: nextWeek,
    weekNumber,
    matchupPool: matchups * MATCHUP_REGISTRATION_POOL,
    opPrize: MATCHUP_OP_PRIZE
  };
}
