import type { Repo } from '@packages/scoutgame/repos/getRepos';
import { useGETImmutable } from '@packages/scoutgame-ui/hooks/helpers';

export function useSearchRepos(searchString: string) {
  return useGETImmutable<Repo[]>(searchString ? '/api/repos' : null, { searchString });
}
