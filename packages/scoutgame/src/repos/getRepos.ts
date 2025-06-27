import type { GithubEvent, GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type Repo = {
  createdAt: string;
  deletedAt: string | null;
  id: number;
  name: string;
  owner: string;
  commits: number;
  prs: number;
  closedPrs: number;
  contributors: number;
  scoutPartnerId: string | null;
};

export async function getRepos({
  searchString,
  limit
}: { searchString?: string; limit?: number; includeInactive?: boolean; filter?: 'name' | 'owner' } = {}): Promise<
  Repo[]
> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }

  const repos = await prisma.githubRepo.findMany({
    take: limit,
    orderBy: searchString
      ? [
          {
            _relevance: {
              fields: ['owner'],
              search: searchString,
              sort: 'desc'
            }
          },
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      : { createdAt: 'desc' },
    where: {
      name: { contains: searchString, mode: 'insensitive' }
    },
    include: {
      events: true
    }
  });
  return mapRepo(repos);
}

export async function getPopularRepos({ limit = 20 }: { limit?: number } = {}): Promise<Repo[]> {
  const repos = await prisma.githubRepo.findMany({
    where: {
      events: {
        some: {
          type: 'merged_pull_request',
          githubUser: {
            builderId: {
              not: null
            }
          }
        }
      }
    },
    orderBy: {
      events: {
        _count: 'desc'
      }
    },
    take: limit,
    include: {
      events: true
    }
  });

  return mapRepo(repos);
}

function mapRepo(repos: (GithubRepo & { events: GithubEvent[] })[]): Repo[] {
  return repos.map((repo) => ({
    name: repo.name,
    owner: repo.owner,
    id: repo.id,
    createdAt: repo.createdAt.toISOString(),
    deletedAt: repo.deletedAt?.toISOString() ?? null,
    commits: repo.events.filter((event) => event.type === 'commit').length,
    prs: repo.events.filter((event) => event.type === 'merged_pull_request').length,
    closedPrs: repo.events.filter((event) => event.type === 'closed_pull_request').length,
    contributors: new Set(repo.events.map((event) => event.createdBy)).size,
    scoutPartnerId: repo.scoutPartnerId
  }));
}
