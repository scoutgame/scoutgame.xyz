import env from '@beam-australia/react-env';
import { DateTime } from 'luxon';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });
// 11:00 EST, 15:00 UTC
const DRAFT_START_DATE = DateTime.fromISO(
  env('DRAFT_START_DATE') || process.env.REACT_APP_DRAFT_START_DATE || '2025-04-16T15:00:00.000Z',
  { zone: 'utc' }
);

export function isDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function isDraftEnabled(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_START_DATE && nowUtc < DRAFT_END_DATE;
}
