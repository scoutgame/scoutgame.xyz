import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';
import { useGETImmutable, usePUT } from '@packages/scoutgame-ui/hooks/helpers';

export function useSearchBuilders(search: string) {
  return useGETImmutable<BuilderSearchResult[]>(search ? '/api/builders/search' : null, {
    search
  });
}

export function useRefreshShareImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}
