import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { useGETImmutable } from '@packages/scoutgame-ui/hooks/helpers';

export function useGetQuests() {
  return useGETImmutable<DailyClaim[] | null>('/api/quests/daily-claims');
}
