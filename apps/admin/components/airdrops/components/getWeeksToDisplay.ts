import {
  getLastWeek,
  getWeekStartEndFormatted,
  getDateFromISOWeek,
  getCurrentWeek,
  getCurrentSeasonStart,
  getPreviousSeason,
  getAllISOWeeksFromSeasonStartUntilSeasonEnd
} from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';

export function getWeeksToDisplay() {
  const currentWeek = getCurrentWeek();
  const currentSeason = getCurrentSeasonStart();
  // include last 2 seasons
  const seasons = [
    getPreviousSeason(getPreviousSeason(currentSeason)),
    getPreviousSeason(currentSeason),
    currentSeason
  ].filter(isTruthy);
  const weeks = seasons
    .flatMap((season) => getAllISOWeeksFromSeasonStartUntilSeasonEnd({ season }))
    .filter((week) => week <= currentWeek)
    .sort()
    .reverse();
  return { weeks, seasons };
}
