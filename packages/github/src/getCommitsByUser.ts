import type { Endpoints } from '@octokit/types';
import { getOctokit } from '@packages/github/client';

export type Commit = Endpoints['GET /search/commits']['response']['data']['items'][number];

export async function getCommitsByUser({ login, after, token }: { login: string; after: Date; token?: string }) {
  const octokit = getOctokit(token);
  const query = `author:${login} committer-date:>=${after.toISOString()}`;
  const response = await octokit.request('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100
  });
  return response.data.items;
}
