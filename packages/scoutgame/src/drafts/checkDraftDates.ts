import env from '@beam-australia/react-env';
import { isDraftSeason } from '@packages/dates/utils';
import { DateTime } from 'luxon';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });

export function hasDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function isDraftEnabled(): boolean {
  const draftSeason = isDraftSeason();
  if (!draftSeason) {
    return false;
  }
  const nowUtc = DateTime.now().toUTC();
  if (nowUtc > DRAFT_END_DATE) {
    return false;
  }

  const isDraftLive = env('IS_DRAFT_LIVE') || process.env.REACT_APP_IS_DRAFT_LIVE;
  return isDraftLive === 'true';
}
