import { useGETImmutable, usePOST } from '@packages/scoutgame-ui/hooks/helpers';

import type { Repo } from 'lib/repos/getRepos';

export function useSearchRepos(searchString: string) {
  return useGETImmutable<Repo[]>(searchString ? '/api/repos' : null, { searchString });
}

export function useCreateRepos() {
  return usePOST<{ owner: string; partner?: string }>('/api/repos');
}
