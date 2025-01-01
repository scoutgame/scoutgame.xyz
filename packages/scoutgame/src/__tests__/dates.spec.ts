import { DateTime } from 'luxon';

import type { Season } from '../dates/config';
import {
  getWeekFromDate,
  getWeekStartEnd,
  getSeasonWeekFromISOWeek,
  validateISOWeek,
  getCurrentWeek,
  getCurrentSeason
} from '../dates/utils';

describe('date utils', () => {
  describe('getWeekFromDate', () => {
    it('should return the previous year when the first day of the year is a Sunday', () => {
      const jan1 = DateTime.fromObject({ year: 2023, month: 1, day: 1 }, { zone: 'utc' }).toJSDate();
      expect(getWeekFromDate(jan1)).toEqual('2022-W52');
    });
    it('should start on Monday', () => {
      const dec31 = DateTime.fromObject({ year: 2023, month: 1, day: 2 }, { zone: 'utc' }).toJSDate();
      expect(getWeekFromDate(dec31)).toEqual('2023-W01');
    });

    // leap year date pulled from https://en.wikipedia.org/wiki/ISO_week_date
    it('handle leap years with 53 weeks', () => {
      const dec31 = DateTime.fromObject({ year: 1982, month: 1, day: 3 }, { zone: 'utc' }).toJSDate();
      expect(getWeekFromDate(dec31)).toEqual('1981-W53');
    });
  });

  describe('getWeekStartEnd', () => {
    it('should return start and end of the week', () => {
      const dec31 = new Date('2023-01-01T00:00:00.000Z'); // jan 1 is a Sunday
      const result = getWeekStartEnd(dec31);
      expect(result.start.toJSDate().toISOString()).toEqual('2022-12-26T00:00:00.000Z');
      expect(result.end.toJSDate().toISOString()).toEqual('2023-01-01T23:59:59.999Z');
    });
  });

  describe('getSeasonWeekFromISOWeek', () => {
    it('should return the season week number when the season is ahead of the current week', () => {
      const seasonWeek = 3;
      const seasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 2 }, { zone: 'utc' });
      const season = getWeekFromDate(seasonStartDate.toJSDate());
      const currentSeasonDate = seasonStartDate.plus({
        weeks: seasonWeek - 1
      });
      const formattedWeek = getWeekFromDate(currentSeasonDate.toJSDate());
      expect(getSeasonWeekFromISOWeek({ week: formattedWeek, season })).toEqual(seasonWeek);
    });

    it('should return the season week number when the season is behind the current week', () => {
      const seasonWeek = 10;
      const seasonStartDate = DateTime.fromObject({ year: 2024, month: 10, day: 28 }, { zone: 'utc' }); // Oct 28, 2024 is a Monday
      const season = getWeekFromDate(seasonStartDate.toJSDate());
      const currentSeasonDate = seasonStartDate.plus({
        weeks: seasonWeek - 1
      });
      const formattedWeek = getWeekFromDate(currentSeasonDate.toJSDate());
      expect(getSeasonWeekFromISOWeek({ week: formattedWeek, season })).toEqual(seasonWeek);
    });
  });

  describe('validateIsoWeek', () => {
    test('should return the right boolean', () => {
      expect(validateISOWeek('2022-W01')).toBe(false);
      expect(validateISOWeek('2024-W53')).toBe(false);
      expect(validateISOWeek('2025-W53')).toBe(false);
      expect(validateISOWeek('2025-W1')).toBe(false);
      expect(validateISOWeek('2024-W40')).toBe(true);
      expect(validateISOWeek('2024-W01')).toBe(true);
      expect(validateISOWeek(getCurrentWeek())).toBe(true);
    });
  });

  describe('getCurrentSeason', () => {
    const seasonStarts = ['2024-W01', '2024-W05', '2024-W10'];

    it('should return the season when the current week is the first week of a season', () => {
      const currentSeason = getCurrentSeason('2024-W01', seasonStarts as Season[]);
      expect(currentSeason).toEqual('2024-W01');
    });

    it('should return the season when the current week is the in the middle of a season', () => {
      const currentSeason = getCurrentSeason('2024-W03', seasonStarts as Season[]);
      expect(currentSeason).toEqual('2024-W01');
    });

    it('should return the season when the current week is after the last season', () => {
      const currentSeason = getCurrentSeason('2024-W15', seasonStarts as Season[]);
      expect(currentSeason).toEqual('2024-W10');
    });

    it('Should throw an error when given an invalid season list', () => {
      const missingSeason = ['2024-W03', ''];
      expect(() => getCurrentSeason('2024-W03', missingSeason as Season[])).toThrow();
    });

    it('Should throw an error when given an invalid season list', () => {
      const currentWeek = '2024-W03';
      const unsortedSeasons = ['2024-W03', '2024-W02'];
      expect(() => getCurrentSeason(currentWeek, unsortedSeasons as Season[])).toThrow();
    });

    it('Should fail if the current week is before the first season', () => {
      const currentWeek = '2023-W01';
      expect(() => getCurrentSeason(currentWeek, seasonStarts as Season[])).toThrow();
    });
  });
});
