import { DateTime } from 'luxon';

export const AIRDROP_START_DATE = DateTime.fromISO('2025-04-21T15:00:00.000Z', { zone: 'utc' });

const currentTime = DateTime.now().toUTC();

export function isAirdropLive() {
  return AIRDROP_START_DATE.diff(currentTime).toMillis() > 0;
}
