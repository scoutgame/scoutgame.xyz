import { DateTime } from 'luxon';

export const currentSeason = 1;

// Season start MUST be on a Monday, when isoweek begins
export const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' });
export const currentSeasonEndDate = currentSeasonStartDate.plus({ weeks: 13 });

export const streakWindow = 7 * 24 * 60 * 60 * 1000;

// Return the format of week
export function getCurrentWeek() {
  return formatWeek(DateTime.utc());
}

export function getLastWeek() {
  return formatWeek(DateTime.utc().minus({ week: 1 }));
}

// get the number of the current week, with Sunday being the first day of the week in New York time
export function getFormattedWeek(date: Date): string {
  return formatWeek(DateTime.fromJSDate(date, { zone: 'utc' }));
}

export function getWeekStartEnd(date: Date) {
  const utcDate = DateTime.fromJSDate(date, { zone: 'utc' });
  const startOfWeek = utcDate.startOf('week');
  const endOfWeek = utcDate.endOf('week');
  return { start: startOfWeek, end: endOfWeek };
}

function formatWeek(date: DateTime) {
  // token reference: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
  return date.toFormat(`kkkk-'W'WW`);
}

export function isToday(date: Date) {
  const dateDay = DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day');
  return dateDay.equals(DateTime.utc().startOf('day'));
}

export function getCurrentWeekPoints() {
  // TODO: Get points allocation for the week
  return 100000;
}

export function getCurrentWeekNumber() {
  const currentDate = DateTime.utc();
  const weeksDiff = currentDate.diff(currentSeasonStartDate, 'weeks').weeks;
  return Math.floor(weeksDiff) + 1;
}

export function getSeasonWeekNumberFromWeek({ seasonStartDate, week }: { week: string; seasonStartDate: DateTime }) {
  const date = DateTime.fromISO(week, { zone: 'utc' });
  const weeksDiff = date.diff(seasonStartDate, 'weeks').weeks;
  return weeksDiff + 1;
}
