import { prisma } from '@charmverse/core/prisma-client';
import {
  getCurrentSeasonWeekNumber,
  getWeekFromDate,
  getStartOfWeek,
  getEndOfWeek,
  getCurrentWeek
} from '@packages/dates/utils';
import { DateTime } from 'luxon';

import { MATCHUP_REGISTRATION_POOL, MATCHUP_OP_PRIZE, REGISTRATION_DAY_OF_WEEK } from './config';

export type MatchupDetails = {
  week: string;
  weekNumber: number;
  matchupPool: number;
  opPrize: number;
  startTime: number;
  endTime: number;
  registrationOpen: boolean;
};

// matchup begins at end of registration day
function getStartOfMatchup(week: string) {
  return getStartOfWeek(week).plus({ days: REGISTRATION_DAY_OF_WEEK }).toJSDate();
}

function getEndOfMatchup(week: string) {
  return getEndOfWeek(week).toJSDate();
}

export function getCurrentMatchupDetails() {
  return getMatchupDetails(getCurrentWeek());
}

export async function getMatchupDetails(week: string, now = DateTime.utc()): Promise<MatchupDetails> {
  const matchups = await prisma.scoutMatchup.count({
    where: {
      week
    }
  });
  const startTime = getStartOfMatchup(week).getTime();
  const endTime = getEndOfMatchup(week).getTime();
  const registrationOpen = now.weekday === REGISTRATION_DAY_OF_WEEK && getWeekFromDate(now.toJSDate()) === week;

  const weekNumber = getCurrentSeasonWeekNumber(week);
  return {
    week,
    weekNumber,
    matchupPool: matchups * MATCHUP_REGISTRATION_POOL,
    opPrize: MATCHUP_OP_PRIZE,
    startTime,
    endTime,
    registrationOpen
  };
}
