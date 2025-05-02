import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { getWeekFromDate, getNextWeek } from '@packages/dates/utils';
import { mockMatchup, mockScout } from '@packages/testing/database';
import { DateTime } from 'luxon';

import { MATCHUP_REGISTRATION_POOL, MATCHUP_OP_PRIZE, REGISTRATION_DAY_OF_WEEK } from '../config';
import { getMatchupDetails } from '../getMatchupDetails';

describe('getMatchupDetails', () => {
  it('should return correct details for current week with no matchups', async () => {
    // should be on a Monday
    const now = DateTime.fromObject({ year: 2025, month: 3, day: 3 }, { zone: 'utc' });
    const currentWeek = getWeekFromDate(now.toJSDate());

    const details = await getMatchupDetails(currentWeek, now);

    expect(details).toEqual({
      week: currentWeek,
      weekNumber: 9,
      matchupPool: 0, // No matchups
      opPrize: MATCHUP_OP_PRIZE,
      startTime: now.startOf('week').plus({ days: REGISTRATION_DAY_OF_WEEK }).toJSDate().getTime(),
      endTime: now.endOf('week').toJSDate().getTime(),
      registrationOpen: true // It's registration day
    });
  });

  it('should return correct details for current week with matchups', async () => {
    const now = DateTime.fromObject(
      { year: 2025, month: 1, day: 6, weekday: REGISTRATION_DAY_OF_WEEK },
      { zone: 'utc' }
    );
    const currentWeek = getWeekFromDate(now.toJSDate());

    // Create some mock scouts
    const scout1 = await mockScout({ displayName: 'Scout 1' });
    const scout2 = await mockScout({ displayName: 'Scout 2' });
    const scout3 = await mockScout({ displayName: 'Scout 3' });

    // Create matchups for these scouts
    await Promise.all([
      mockMatchup({ createdBy: scout1.id, week: currentWeek }),
      mockMatchup({ createdBy: scout2.id, week: currentWeek }),
      mockMatchup({ createdBy: scout3.id, week: currentWeek })
    ]);

    const details = await getMatchupDetails(currentWeek, now);

    expect(details).toEqual({
      week: currentWeek,
      weekNumber: 1,
      matchupPool: 3 * MATCHUP_REGISTRATION_POOL, // 3 matchups
      opPrize: MATCHUP_OP_PRIZE,
      startTime: now.startOf('week').plus({ days: REGISTRATION_DAY_OF_WEEK }).toJSDate().getTime(),
      endTime: now.endOf('week').toJSDate().getTime(),
      registrationOpen: true // It's registration day
    });
  });

  it('should return correct details for next week', async () => {
    const now = DateTime.fromObject({ year: 2025, month: 2, day: 6 }, { zone: 'utc' });
    const nextWeek = getNextWeek(getWeekFromDate(now.toJSDate()));

    const details = await getMatchupDetails(nextWeek, now);

    expect(details).toEqual({
      week: nextWeek,
      weekNumber: 6,
      matchupPool: 0, // No matchups
      opPrize: MATCHUP_OP_PRIZE,
      startTime: now.startOf('week').plus({ weeks: 1, days: REGISTRATION_DAY_OF_WEEK }).toJSDate().getTime(),
      endTime: now.plus({ weeks: 1 }).endOf('week').toJSDate().getTime(),
      registrationOpen: false // Not registration day for next week
    });
  });

  it('should return registrationOpen as false when not on registration day', async () => {
    const currentWeek = '2024-W40';
    const now = DateTime.fromObject(
      { year: 2023, month: 3, day: 7, weekday: REGISTRATION_DAY_OF_WEEK + 1 },
      { zone: 'utc' }
    );

    const details = await getMatchupDetails(currentWeek, now);

    expect(details.registrationOpen).toBe(false);
  });
});
