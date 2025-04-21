import env from '@beam-australia/react-env';
import { DateTime } from 'luxon';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });
// 11:00 EST, 15:00 UTC
const DRAFT_START_DATE = env('AIRDROP_START_DATE') || process.env.REACT_APP_AIRDROP_START_DATE;

export function isDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function isDraftEnabled(): boolean {
  if (!DRAFT_START_DATE) {
    return false;
  }
  const nowUtc = DateTime.utc();
  const draftStartDate = DateTime.fromISO(DRAFT_START_DATE);

  return nowUtc > draftStartDate && nowUtc < DRAFT_END_DATE;
}
