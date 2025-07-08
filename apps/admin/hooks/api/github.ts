import { useGETImmutable, useDELETE } from '@packages/scoutgame-ui/hooks/helpers';
import type { GetReposResult } from 'app/api/github/get-repos/route';

import type { RepoSearchResult } from '../../app/api/github/search-repos/route';
import type { GithubUserStats } from '../../app/api/github/user-stats/route';

export function useSearchReposByOwnerFromGithub(owner: string, partner?: string) {
  return useGETImmutable<RepoSearchResult[]>(owner ? '/api/github/search-repos' : null, { owner, partner });
}

export function useGetGithubReposFromDatabase(nameOrOwner: string, partner?: boolean) {
  return useGETImmutable<GetReposResult[]>('/api/github/get-repos', {
    nameOrOwner,
    partner: partner ? 'true' : 'false'
  });
}

export function useGetGithubUserStats(login: string | null) {
  return useGETImmutable<GithubUserStats>(login ? '/api/github/user-stats' : null, { login });
}

export function useDeleteGithubUserStrike() {
  return useDELETE<{ strikeId: string }>('/api/github/delete-strike');
}
