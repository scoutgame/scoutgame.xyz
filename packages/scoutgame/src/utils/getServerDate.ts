import { DateTime } from 'luxon';

export function getServerDate(): DateTime {
  return DateTime.utc();
}
