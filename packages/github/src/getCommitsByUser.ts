import type { Endpoints } from '@octokit/types';
import { getOctokit } from '@packages/github/client';

export type Commit = Endpoints['GET /search/commits']['response']['data']['items'][number];

export async function getCommitsByUser({ login, after }: { login: string; after: Date }) {
  const octokit = getOctokit();
  const query = `author:${login} committer-date:>=${after.toISOString()}`;
  const response = await octokit.request('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100
  });
  return response.data.items;
}
