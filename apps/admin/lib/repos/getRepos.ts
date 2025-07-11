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
  limit,
  includeInactive, // include repos that have no activity
  partner
}: { searchString?: string; limit?: number; includeInactive?: boolean; partner?: string } = {}): Promise<Repo[]> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }
  const ownerAndName = typeof searchString === 'string' ? searchString.split('/') : undefined;

  const repos = await prisma.githubRepo.findMany({
    take: limit,
    orderBy: ownerAndName
      ? [
          {
            _relevance: {
              fields: ['owner'],
              search: ownerAndName[0],
              sort: 'desc'
            }
          },
          { createdAt: 'desc' },
          { name: 'asc' }
        ]
      : { createdAt: 'desc' },
    where: ownerAndName
      ? {
          scoutPartnerId: partner,
          owner: {
            contains: ownerAndName[0],
            mode: 'insensitive'
          },
          deletedAt: null,
          name: ownerAndName[1] ? { contains: ownerAndName[1], mode: 'insensitive' } : undefined
        }
      : includeInactive
        ? {
            scoutPartnerId: partner,
            deletedAt: null
          }
        : {
            scoutPartnerId: partner,
            deletedAt: null,
            // filter for repos that have activity by default
            OR: [
              {
                events: {
                  some: {
                    githubUser: {
                      builderId: {
                        not: null
                      }
                    }
                  }
                }
              },
              {
                scoutPartnerId: {
                  not: null
                }
              }
            ]
          },
    include: {
      events: true
    }
  });

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
