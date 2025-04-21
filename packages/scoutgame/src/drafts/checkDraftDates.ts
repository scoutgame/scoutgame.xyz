import env from '@beam-australia/react-env';
import { isDraftSeason } from '@packages/dates/utils';
import { DateTime } from 'luxon';

export const whitelistedScoutIds = [
  'f534b485-b7d5-47c3-92d8-02d107158558',
  'b6cb2938-91dd-4274-8d85-aa2e00eb97e2',
  '00c4af4f-b0f8-41e8-b27d-29996d694034',
  '4cbfa422-70a2-400e-8b37-71e3d1e74dfb', // alex
  '6f9bd132-c597-45a3-8d9b-6d1af140bc6b', // ilias
  '8eab35cf-f79c-488f-b3b8-acda8c642719' // xandra
];

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });

export function hasDraftEnded(): boolean {
  const nowUtc = DateTime.utc();
  return nowUtc > DRAFT_END_DATE;
}

export function isDraftEnabled(userId?: string): boolean {
  const draftSeason = isDraftSeason();
  if (!draftSeason) {
    return false;
  }
  const nowUtc = DateTime.now().toUTC();
  if (nowUtc > DRAFT_END_DATE) {
    return false;
  }

  const isDraftLive = env('IS_DRAFT_LIVE') || process.env.REACT_APP_IS_DRAFT_LIVE;
  return (userId && whitelistedScoutIds.includes(userId)) || isDraftLive === 'true';
}
