import env from '@beam-australia/react-env';
import { DateTime } from 'luxon';

import type { ISOWeek, Season, SeasonConfig } from './config';
import { seasons } from './config';

export function getCurrentSeason(
  _currentWeek: ISOWeek = getCurrentWeek(),
  seasonList: SeasonConfig[] = seasons
): SeasonConfig {
  const envSeason = env('SEASON') || process.env.REACT_APP_SEASON;
  if (envSeason) {
    const envSeasonConfig = seasonList.find((s) => s.start === envSeason);
    if (envSeasonConfig) {
      return envSeasonConfig;
    }
    throw new Error(`Invalid season: ${process.env.SEASON}`);
  }
  const _seasonStarts = seasonList.map((s) => s.start);
  // Validate the season list so that logic can make assumptions below
  validateSeasonList(_seasonStarts);
  const _seasons = seasonList.slice(); // make a copy of the season list
  let _currentSeason = _seasons.shift()!;
  if (_currentWeek < _currentSeason.start) {
    throw new Error(`Current week (${_currentWeek}) is before the first season (${_currentSeason.start})`);
  }
  while (_seasons.length > 0 && _currentWeek >= _seasons[0].start) {
    _currentSeason = _seasons.shift()!;
  }

  return _currentSeason;
}

export function getSeasonConfig(startOfSeason: Season): SeasonConfig {
  const season = seasons.find((s) => s.start === startOfSeason);
  if (!season) {
    throw new Error(`Invalid season: ${startOfSeason}`);
  }
  return season;
}

// Return the start of the current season
export function getCurrentSeasonStart(
  _currentWeek: ISOWeek = getCurrentWeek(),
  seasonList: SeasonConfig[] = seasons
): ISOWeek {
  return getCurrentSeason(_currentWeek, seasonList).start;
}

export function isDraftSeason(season: Season = getCurrentSeason().start): boolean {
  const currentSeason = getSeasonConfig(season);
  const IS_DRAFT_SEASON = env('IS_DRAFT_SEASON') || process.env.REACT_APP_IS_DRAFT_SEASON;

  if (IS_DRAFT_SEASON) {
    return IS_DRAFT_SEASON === 'true';
  }
  return currentSeason.draft ?? false;
}

export function isEndOfDraftWeek(now: DateTime = DateTime.utc()): boolean {
  const isWeekend = now.weekday >= 6;
  return isWeekend;
}

export function validateSeasonList(seasonList: Season[]): void {
  if (!seasonList.every((s) => s)) {
    throw new Error('Invalid season list');
  }
  if (seasonList.slice().sort().join(',') !== seasonList.join(',')) {
    throw new Error('Season list is not sorted');
  }
}

// Return the format of week
export function getCurrentWeek(): ISOWeek {
  return _formatWeek(DateTime.utc());
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

export function getPreviousSeason(season: Season | null): Season | null {
  const seasonIndex = seasons.findIndex((s) => s.start === season);
  return seasons[seasonIndex - 1]?.start || null;
}
export function getPreviousNonDraftSeason(season: Season): Season | null {
  const seasonIndex = seasons.filter((s) => !s.draft).findIndex((s) => s.start === season);
  return seasons[seasonIndex - 1]?.start || null;
}

export function getNextSeason(season: Season): Season | null {
  const seasonIndex = seasons.findIndex((s) => s.start === season);
  return seasons[seasonIndex + 1]?.start || null;
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

export function getWeekendDate(date: Date = new Date()) {
  const utcDate = DateTime.fromJSDate(date, { zone: 'utc' });
  const friday = utcDate.set({ weekday: 5 }); // 5 is Friday
  return friday.endOf('day');
}

export function getWeekStartEnd(date: Date) {
  const utcDate = DateTime.fromJSDate(date, { zone: 'utc' });
  const startOfWeek = utcDate.startOf('week');
  const endOfWeek = utcDate.endOf('week');
  return { start: startOfWeek, end: endOfWeek };
}

export function getWeekStartEndFromISOWeek(week: ISOWeek) {
  const date = getDateFromISOWeek(week);
  return getWeekStartEnd(date.toJSDate());
}

export function getWeekStartEndFormatted(date: Date) {
  const { start, end } = getWeekStartEnd(date);
  return `${start.toFormat('MMM d')} to ${end.toFormat('MMM d')}`;
}

export function getStartOfWeek(week: ISOWeek) {
  return getDateFromISOWeek(week);
}

export function getEndOfWeek(week: ISOWeek) {
  return getDateFromISOWeek(week).endOf('week');
}

export function getWeekStartEndSecondTimestamps(week: ISOWeek) {
  const { start, end } = getWeekStartEnd(getStartOfWeek(week).toJSDate());
  return { start: Math.floor(start.toSeconds()), end: Math.floor(end.toSeconds()) };
}

export function getSeasonStartEndSecondTimestamps(season: Season) {
  const seasonWeeks = getAllISOWeeksFromSeasonStart({
    season
  });

  const start = Math.floor(getStartOfWeek(seasonWeeks[0]).toSeconds());
  const end = Math.floor(getEndOfSeason(season).toSeconds());

  return { start, end };
}

function _formatWeek(date: DateTime): ISOWeek {
  // token reference: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
  return date.toFormat(`kkkk-'W'WW`);
}

export function dateTimeToWeek(date: DateTime): ISOWeek {
  return _formatWeek(date);
}

export function getStartOfDay(date: Date) {
  return DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day');
}

export function isToday(date: Date, now = DateTime.utc()) {
  const dateDay = DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day');
  return dateDay.equals(now.startOf('day'));
}

export function getCurrentSeasonWeekNumber(week: ISOWeek = getCurrentWeek()): number {
  const season = getCurrentSeason(week).start;
  return getSeasonWeekFromISOWeek({ season, week });
}

// Week 1, 2, etc.
export function getSeasonWeekFromISOWeek({ season, week }: { season: ISOWeek; week: ISOWeek }): number {
  const weekDate = DateTime.fromISO(week, { zone: 'utc' });
  const seasonDate = DateTime.fromISO(season, { zone: 'utc' });
  const weeksDiff = weekDate.diff(seasonDate, 'weeks').weeks;
  return weeksDiff + 1;
}

export function getAllISOWeeksFromSeasonStart({
  season = getCurrentSeason().start
}: { season?: Season } = {}): string[] {
  const start = getStartOfWeek(season);
  const end = DateTime.now();
  const weeksPerSeason = getSeasonConfig(season).weeksPerSeason;
  let current = start;
  const weeks: string[] = [];
  while (current <= end && weeks.length < weeksPerSeason) {
    weeks.push(_formatWeek(current));
    current = current.plus({ weeks: 1 });
  }

  return weeks;
}

export function getAllISOWeeksFromSeasonStartUntilSeasonEnd({ season }: { season: Season }): ISOWeek[] {
  const start = getStartOfWeek(season);
  const weeksPerSeason = getSeasonConfig(season).weeksPerSeason;
  let current = start;
  const weeks: ISOWeek[] = [];

  for (let i = 0; i < weeksPerSeason; i++) {
    weeks.push(_formatWeek(current));
    current = current.plus({ weeks: 1 });
  }

  return weeks;
}

export function getSeasonFromDate(date: Date) {
  const dateTime = DateTime.fromJSDate(date, { zone: 'utc' });
  const isoWeek = _formatWeek(dateTime);

  try {
    // Find the season this date belongs to
    const season = getCurrentSeason(isoWeek);
    return season.start;
  } catch (error) {
    // If the date is before the first season or doesn't belong to any season
    return null;
  }
}

export function getValidSeasons(): SeasonConfig[] {
  return seasons.filter((s) => !s.draft && !s.preseason);
}

export function getFromBlockForContract(contractAddress: `0x${string}`) {
  const seasonConfig = seasons.find(
    (s) => s.standardNftAddress === contractAddress || s.starterNftAddress === contractAddress
  );
  if (!seasonConfig) {
    throw new Error(`Season config not found for contract address: ${contractAddress}`);
  }
  if (!seasonConfig.nftBlockNumber) {
    throw new Error(`NFT block number not found for season: ${seasonConfig.start}`);
  }
  return BigInt(seasonConfig.nftBlockNumber);
}
