import { jest } from '@jest/globals';
import { DateTime } from 'luxon';

import type { Season, SeasonConfig } from '../config';
import {
  getWeekFromDate,
  getWeekStartEnd,
  getSeasonWeekFromISOWeek,
  validateISOWeek,
  getCurrentWeek,
  getCurrentSeasonStart,
  getAllISOWeeksFromSeasonStart,
  dateTimeToWeek,
  getEndOfWeek
} from '../utils';

describe('scoutgame date utils', () => {
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

  describe('dateTimeToWeek', () => {
    it('should convert DateTime to ISO week format', () => {
      const date = DateTime.fromObject({ year: 2023, month: 1, day: 2 }, { zone: 'utc' });
      expect(dateTimeToWeek(date)).toEqual('2023-W01');
    });

    it('should handle year boundary cases', () => {
      const date = DateTime.fromObject({ year: 2023, month: 1, day: 1 }, { zone: 'utc' });
      expect(dateTimeToWeek(date)).toEqual('2022-W52');
    });

    it('should handle leap years', () => {
      const date = DateTime.fromObject({ year: 1982, month: 1, day: 3 }, { zone: 'utc' });
      expect(dateTimeToWeek(date)).toEqual('1981-W53');
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

  describe('getEndOfWeek', () => {
    it('should return the end of the week for a given ISO week', () => {
      const week = '2023-W01';
      const result = getEndOfWeek(week);
      expect(result.toJSDate().toISOString()).toEqual('2023-01-08T23:59:59.999Z');
    });

    it('should handle year boundary cases', () => {
      const week = '2022-W52';
      const result = getEndOfWeek(week);
      expect(result.toJSDate().toISOString()).toEqual('2023-01-01T23:59:59.999Z');
    });

    it('should handle leap years', () => {
      const week = '2020-W53';
      const result = getEndOfWeek(week);
      expect(result.toJSDate().toISOString()).toEqual('2021-01-03T23:59:59.999Z');
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

  describe('getCurrentSeasonStart', () => {
    const seasons = [
      { start: '2024-W01', title: 'season 1' },
      { start: '2024-W05', title: 'season 2' },
      { start: '2024-W10', title: 'season 3' }
    ] as SeasonConfig[];

    it('should return the season when the current week is the first week of a season', () => {
      const currentSeason = getCurrentSeasonStart('2024-W01', seasons);
      expect(currentSeason).toEqual('2024-W01');
    });

    it('should return the season when the current week is the in the middle of a season', () => {
      const currentSeason = getCurrentSeasonStart('2024-W03', seasons);
      expect(currentSeason).toEqual('2024-W01');
    });

    it('should return the season when the current week is after the last season', () => {
      const currentSeason = getCurrentSeasonStart('2024-W15', seasons);
      expect(currentSeason).toEqual('2024-W10');
    });

    it('Should throw an error when given an invalid season list', () => {
      const missingSeason = [
        { start: '2024-W03', title: 'season 1' },
        { start: '2024-W02', title: 'season 2' }
      ] as SeasonConfig[];
      expect(() => getCurrentSeasonStart('2024-W03', missingSeason)).toThrow();
    });

    it('Should throw an error when given an invalid season list', () => {
      const currentWeek = '2024-W03';
      const unsortedSeasons = [
        { start: '2024-W03', title: 'season 1' },
        { start: '2024-W02', title: 'season 2' }
      ] as SeasonConfig[];
      expect(() => getCurrentSeasonStart(currentWeek, unsortedSeasons)).toThrow();
    });

    it('Should fail if the current week is before the first season', () => {
      const currentWeek = '2023-W01';
      expect(() => getCurrentSeasonStart(currentWeek, seasons)).toThrow();
    });
  });
});

describe('getAllWeeksFromSeasonStart', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return all weeks from the start of the season to the current week included', () => {
    const season = '2025-W02';

    // 10 days after the start of season 2, so we should get 2 weeks
    jest.setSystemTime(new Date('2025-01-16T00:00:00.000Z'));

    const weeks = getAllISOWeeksFromSeasonStart({ season });

    expect(weeks).toEqual(['2025-W02', '2025-W03']);
  });

  it('should return all weeks from the start of the season, stopping at the end of the season if that season has passed', () => {
    const season = '2024-W41';

    // 10 days after the start of season 2
    jest.setSystemTime(new Date('2025-01-20T00:00:00.000Z'));

    const weeks = getAllISOWeeksFromSeasonStart({ season });
    expect(weeks).toEqual([
      '2024-W41',
      '2024-W42',
      '2024-W43',
      '2024-W44',
      '2024-W45',
      '2024-W46',
      '2024-W47',
      '2024-W48',
      '2024-W49',
      '2024-W50',
      '2024-W51',
      '2024-W52',
      '2025-W01'
    ]);
  });
});
