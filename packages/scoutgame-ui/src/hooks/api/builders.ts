import type { BuilderSearchResult } from '@packages/scoutgame/builders/searchBuilders';

import { useGETImmutable, usePUT } from '../helpers';

export function useRefreshShareImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}

export function useSearchBuilders(search: string) {
  return useGETImmutable<BuilderSearchResult[]>(search ? '/api/builders/search' : null, {
    search
  });
}
