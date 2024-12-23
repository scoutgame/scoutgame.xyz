import { DateTime } from 'luxon';

export type ISOWeek = string; // isoweek, e.g. '2024-W01'
type WeekOfSeason = number; // the week in the season, e.g. 1

// Season start MUST be on a Monday, when isoweek begins

export const weeksPerSeason = 13;

export const seasons = [
  // dev season
  {
    start: '2024-W38',
    end: '2024-W40',
    title: 'Dev Season'
  },
  // pre-release season
  {
    start: '2024-W40',
    end: '2024-W41',
    title: 'Pre Season'
  },
  // 1st season
  {
    start: '2024-W41',
    end: '2025-W02',
    title: 'Season 1'
  }
] as const;

export type Season = (typeof seasons)[number]['start'];
export const seasonStarts = seasons.map((s) => s.start);

export const currentSeason: Season = '2024-W41';

export const currentSeasonNumber = 1;
export const streakWindow = 7 * 24 * 60 * 60 * 1000;

export const seasonAllocatedPoints = 18_141_850;
// Currently, we are hardcoding the value of weekly allocated points to 100,000

// Return the format of week
export function getCurrentWeek(): ISOWeek {
  return _formatWeek(DateTime.utc());
}

// used for daily rewards
export function getCurrentLocalWeek(): ISOWeek {
  return _formatWeek(DateTime.local());
}

export function getLastWeek(now: DateTime = DateTime.utc()): ISOWeek {
  return getPreviousWeek(_formatWeek(now));
}

export function getPreviousWeek(week: ISOWeek): ISOWeek {
  return _formatWeek(getDateFromISOWeek(week).minus({ week: 1 }));
}

export function getNextWeek(week: ISOWeek): ISOWeek {
  return _formatWeek(getDateFromISOWeek(week).plus({ week: 1 }));
}

export function getPreviousSeason(season: Season): Season {
  const seasonIndex = seasons.findIndex((s) => s.start === season);
  return seasons[seasonIndex - 1].start;
}

export function getWeekFromDate(date: Date): ISOWeek {
  return _formatWeek(DateTime.fromJSDate(date, { zone: 'utc' }));
}

export function getDateFromISOWeek(week: ISOWeek): DateTime {
  return DateTime.fromISO(week, { zone: 'utc' });
}

export function getEndOfSeason(season: Season): DateTime {
  const allWeeks = getAllISOWeeksFromSeasonStartUntilSeasonEnd({ season });

  const lastWeek = allWeeks[allWeeks.length - 1];
  return getDateFromISOWeek(lastWeek).endOf('week');
}

export function validateISOWeek(week: ISOWeek): boolean {
  const date = DateTime.fromISO(week, { zone: 'utc' });
  const now = DateTime.utc();

  return date.isValid && date.year >= 2024 && date <= now;
}

export function getWeekStartEnd(date: Date) {
  const utcDate = DateTime.fromJSDate(date, { zone: 'utc' });
  const startOfWeek = utcDate.startOf('week');
  const endOfWeek = utcDate.endOf('week');
  return { start: startOfWeek, end: endOfWeek };
}

export function getWeekStartEndFormatted(date: Date) {
  const { start, end } = getWeekStartEnd(date);
  return `${start.toFormat('MMM, dd')} - ${end.toFormat('MMM, dd')}`;
}

export function getStartOfWeek(week: ISOWeek) {
  return getDateFromISOWeek(week);
}

function _formatWeek(date: DateTime): ISOWeek {
  // token reference: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
  return date.toFormat(`kkkk-'W'WW`);
}

export function isToday(date: Date, now = DateTime.utc()) {
  const dateDay = DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day');
  return dateDay.equals(now.startOf('day'));
}

export function getCurrentSeasonWeekNumber(week: ISOWeek = getCurrentWeek()): WeekOfSeason {
  return getSeasonWeekFromISOWeek({ season: currentSeason, week });
}

export function getSeasonWeekFromISOWeek({ season, week }: { season: ISOWeek; week: ISOWeek }): WeekOfSeason {
  const weekDate = DateTime.fromISO(week, { zone: 'utc' });
  const seasonDate = DateTime.fromISO(season, { zone: 'utc' });
  const weeksDiff = weekDate.diff(seasonDate, 'weeks').weeks;
  return weeksDiff + 1;
}

export function getAllISOWeeksFromSeasonStart({ season }: { season: Season }): string[] {
  const start = getStartOfWeek(season);
  const end = DateTime.now();

  let current = start;
  const weeks: string[] = [];
  while (current <= end) {
    weeks.push(_formatWeek(current));
    current = current.plus({ weeks: 1 });
  }

  return weeks;
}

export function getAllISOWeeksFromSeasonStartUntilSeasonEnd({ season }: { season: Season }): string[] {
  const start = getStartOfWeek(season);
  let current = start;
  const weeks: string[] = [];

  for (let i = 0; i < weeksPerSeason; i++) {
    weeks.push(_formatWeek(current));
    current = current.plus({ weeks: 1 });
  }

  return weeks;
}
