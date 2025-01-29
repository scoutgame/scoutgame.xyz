import { log } from '@charmverse/core/log';
import { octokit } from '@packages/github/client';
import { prisma } from '@charmverse/core/prisma-client';
import { writeFile } from 'fs/promises';
import { uniqueValuesBy } from '@packages/utils/array';
type RepositoryData = {
  id: string;
  url: string;
  assignableUsers: {
    totalCount: number;
  };
  stargazerCount: number;
  pullRequests: {
    edges: {
      node: {
        id: string;
        number: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        author: {
          login: string;
          avatarUrl?: string;
        };
      };
    }[];
  };
  forkCount: number;
  watchers: {
    totalCount: number;
  };
  // releases: {
  //   totalCount: number;
  // };
};

export type FlatRepositoryData = {
  id: string;
  url: string;
  assignableUserCount: number;
  stargazerCount: number;
  pullRequestCount: number;
  pullRequests: RepositoryData['pullRequests']['edges'];
  recentPullRequestAuthors: number;
  watcherCount: number;
  // releaseCount: number;
  forkCount: number;
  authors: { login: string; avatarUrl?: string }[];
};

const cutoffDate = '2024-12-01';
const queryRange = cutoffDate + '..2025-01-27';

// get pull requests by repo: "<owner>/<repo>"
const queryPullRequests = (repo: string) =>
  octokit.graphql.paginate<{
    search: { edges: { node: RepositoryData['pullRequests']['edges'][number]['node'] }[] };
  }>(
    `query ($searchStr: String!, $cursor: String) {
      search(query: $searchStr, type: ISSUE, first: 100, after: $cursor) {
        edges {
          node {
            ... on PullRequest {
              id
              number
              createdAt
              updatedAt
              title
              author {
                login
                ... on User {
                  id
                  email
                  name
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`,
    {
      searchStr: repo + ' is:pr is:merged updated:' + queryRange
    }
  );

export const queryRepos = (repos: string[]) =>
  octokit.graphql<{ search: { edges: { node: RepositoryData }[] } }>(
    `
  query ($repos: String!) {
    search(query: $repos, type: REPOSITORY, first: 10) {
      edges {
        node {
          ... on Repository {
            id
            url
            assignableUsers {
              totalCount
            }
            stargazerCount
            pullRequests(first: 50, states: MERGED, orderBy: { field: UPDATED_AT, direction: DESC }) {
              edges {
                node {
                  id
                  number
                  createdAt
                  updatedAt
                  title
                  author {
                    login
                    ... on User {
                      id
                      email
                      name
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
              }
            }
            forkCount
            watchers {
              totalCount
            }
          }
        }
      }
    }
  }
`,
    {
      repos: repos.join(' ')
    }
  );

function mapToFlatObject(data: RepositoryData, cutoffDate: Date): FlatRepositoryData {
  const filteredPullRequests = data.pullRequests.edges.filter((edge) => {
    const updatedAt = new Date(edge.node.updatedAt);
    return updatedAt >= cutoffDate;
  });

  const uniqAuthors = uniqueValuesBy(filteredPullRequests.map((pr) => pr.node.author).filter(Boolean), 'login');
  const missingAuthor = filteredPullRequests.find((edge) => !edge.node.author);
  if (missingAuthor) {
    console.log('Missing author', data.url, missingAuthor);
  }

  return {
    id: data.id,
    url: data.url,
    assignableUserCount: data.assignableUsers.totalCount,
    stargazerCount: data.stargazerCount,
    pullRequests: filteredPullRequests,
    pullRequestCount: filteredPullRequests.length,
    recentPullRequestAuthors: uniqAuthors.length, // Ensures unique authors
    watcherCount: data.watchers.totalCount,
    // releaseCount: data.releases.totalCount,
    forkCount: data.forkCount,
    authors: uniqAuthors
  };
}

export async function getRepositoryActivity({ cutoffDate, repos }: { cutoffDate: Date; repos: string[] }) {
  const totalRepos = repos.length;

  const perQuery = 50;

  log.info(`Total repos to query: ${totalRepos}, 50 per query...`);

  const allData: FlatRepositoryData[] = [];

  for (let i = 0; i <= totalRepos; i += perQuery) {
    const repoList = repos.slice(i, i + perQuery).map((repo) => `repo:${repo.replace('https://github.com/', '')}`);

    if (repoList.length === 0) {
      break;
    }

    const results = await queryRepos(repoList)
      .then(async (data) => {
        const repos = data?.search?.edges.map((edge) => edge.node) || [];
        if (!data?.search) {
          console.log('No search data', data);
        }
        const _results: FlatRepositoryData[] = [];
        for (let repo of repos) {
          const prs = repo.pullRequests.edges.filter((edge) => edge.node.updatedAt >= cutoffDate.toISOString());
          // compensate for the limit of 50 PRs from the initial query
          if (prs.length >= 50) {
            try {
              const extra = await queryPullRequests(repo.url.replace('https://github.com/', ''));
              repo.pullRequests.edges = extra.search.edges;
              console.log('requested additional PRs', prs.length, repo.pullRequests.edges.length);
            } catch (e) {
              console.error('Error querying pull requests for repo', repo.url, e);
            }
          }
          _results.push(mapToFlatObject(repo, cutoffDate));
        }
        return _results;
      })
      .catch((error) => {
        console.error('Error querying repos', error);
        return [];
      });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    allData.push(...results);

    log.info(
      `Queried repos ${i + 1}-${i + Math.min(repoList.length, perQuery)} / ${totalRepos}. Results so far: ${allData.length}`
    );
  }
  return allData;
}

async function queryRepoActivity() {
  const repos = await prisma.githubRepo.findMany({
    where: { handPicked: true, events: { none: {} } }
  });
  console.log('Getting activity for', repos.length, 'repos since:', cutoffDate);

  const repoActivity = await getRepositoryActivity({
    cutoffDate: new Date(cutoffDate),
    repos: repos.map((r) => `${r.owner}/${r.name}`)
  });
  // write to file
  await writeFile('latest_handpicked_repo_activity_' + queryRange + '.json', JSON.stringify(repoActivity, null, 2));
}

// queryRepoActivity();
