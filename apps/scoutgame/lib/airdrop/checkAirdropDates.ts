import env from '@beam-australia/react-env';
import { DateTime } from 'luxon';

export const AIRDROP_START_DATE = env('AIRDROP_START_DATE') || process.env.REACT_APP_AIRDROP_START_DATE;

export function isAirdropLive() {
  if (!AIRDROP_START_DATE) {
    return false;
  }
  const now = DateTime.now().toUTC();
  return now > DateTime.fromISO(AIRDROP_START_DATE);
}
