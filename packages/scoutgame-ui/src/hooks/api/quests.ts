import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';

import { useGETImmutable } from '../helpers';

export function useGetQuests() {
  return useGETImmutable<DailyClaim[] | null>('/api/quests/daily-claims');
}
