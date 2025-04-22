import env from '@beam-australia/react-env';
import { getDraftSeasonEndDate, isDraftSeason } from '@packages/dates/utils';
import { DateTime } from 'luxon';

export function hasDraftEnded(): boolean {
  const draftSeason = isDraftSeason();
  if (!draftSeason) {
    return false;
  }
  const draftSeasonEndDate = getDraftSeasonEndDate(new Date());
  const nowUtc = DateTime.utc();
  return nowUtc > draftSeasonEndDate;
}

export function isDraftEnabled(): boolean {
  const draftSeason = isDraftSeason();
  if (!draftSeason) {
    return false;
  }
  const draftSeasonEndDate = getDraftSeasonEndDate(new Date());
  const nowUtc = DateTime.now().toUTC();
  if (nowUtc > draftSeasonEndDate) {
    return false;
  }

  const isDraftLive = env('IS_DRAFT_LIVE') || process.env.REACT_APP_IS_DRAFT_LIVE;
  return isDraftLive === 'true';
}
