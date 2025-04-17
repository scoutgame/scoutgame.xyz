import { DateTime } from 'luxon';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });
const DRAFT_START_DATE = DateTime.fromISO('2025-04-21T15:00:00.000Z', { zone: 'utc' });

export function isDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function isDraftLive(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_START_DATE && nowUtc < DRAFT_END_DATE;
}

export function isDraftEnabled(): boolean {
  const draftEnded = isDraftEnded();
  const draftLive = isDraftLive();
  return draftLive && !draftEnded;
}
