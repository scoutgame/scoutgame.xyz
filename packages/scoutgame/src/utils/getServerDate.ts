import { DateTime } from 'luxon';

export function getServerDate(): DateTime {
  const TIMEZONE = 'America/New_York';
  const LOCALE = 'en-US';
  const date = DateTime.now().plus({ days: 2 }).setZone(TIMEZONE).setLocale(LOCALE);
  return date;
}
