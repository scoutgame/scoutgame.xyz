import { getCurrentWeek, getNextWeek, getWeekFromDate } from '@packages/dates/utils';
import { DateTime } from 'luxon';

import { REGISTRATION_DAY_OF_WEEK } from '../config';
import { isValidRegistrationWeek } from '../registerForMatchup';

describe('isValidRegistrationWeek', () => {
  it('should allow registration for current week on Monday', () => {
    // Create a Monday date for testing
    const monday = DateTime.fromISO(`2023-01-0${1 + REGISTRATION_DAY_OF_WEEK}`); // 1 is a Sunday

    const currentWeek = getWeekFromDate(monday.toJSDate());
    const nextWeek = getNextWeek(currentWeek);
    // Should be valid for current week on Monday
    expect(isValidRegistrationWeek(currentWeek, monday)).toBe(true);
    // Should be invalid for next week on Monday
    expect(isValidRegistrationWeek(nextWeek, monday)).toBe(false);
  });

  it('should allow registration for next week the day after registration day', () => {
    // Create a Tuesday date for testing
    const tuesday = DateTime.fromISO(`2023-01-0${2 + REGISTRATION_DAY_OF_WEEK}`); // 2 is a Monday

    const currentWeek = getWeekFromDate(tuesday.toJSDate());
    const nextWeek = getNextWeek(currentWeek);

    // Should be invalid for current week on Tuesday
    expect(isValidRegistrationWeek(currentWeek, tuesday)).toBe(false);
    // Should be valid for next week on Tuesday
    expect(isValidRegistrationWeek(nextWeek, tuesday)).toBe(true);
  });
});
