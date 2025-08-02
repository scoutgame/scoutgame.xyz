import { prisma } from '@charmverse/core/prisma-client';

import type { Commit } from './getCommitsByUser';
import { getCommitsByUser } from './getCommitsByUser';
import type { PullRequest } from './getPullRequestsByUser';
import { getPullRequestsByUser } from './getPullRequestsByUser';

type UserContributions = {
  commits: Commit[];
  pullRequests: PullRequest[];
  newOwnerRepos: {
    id: number;
    name: string;
    default_branch?: string | null;
    owner: {
      login: string;
    };
    full_name?: string | null;
  }[];
};

export async function getUserContributions({
  login,
  githubUserId,
  after
}: {
  login: string;
  githubUserId?: number;
  after: Date;
}): Promise<UserContributions> {
  const commits = await getCommitsByUser({
    login,
    after,
    paginated: true
  });

  const pullRequests = await getPullRequestsByUser({
    login,
    githubUserId,
    after
  });
  const prRepoIds = pullRequests.map((node) => node.repository.id);
  const commitRepoIds = commits.map((node) => node.repository.id);
  const reposToTrack = await prisma.githubRepo.findMany({
    where: {
      deletedAt: null,
      id: {
        in: [...prRepoIds, ...commitRepoIds]
      }
    },
    select: {
      id: true,
      defaultBranch: true
    }
  });

  return {
    // Filter out PRs we do not follow
    pullRequests: pullRequests.filter((node) => {
      const repo = reposToTrack.find((r) => r.id === node.repository.id);

      if (!repo) {
        return false;
      }

      return node.baseRefName === repo.defaultBranch;
    }),
    commits: commits.filter((node) => reposToTrack.some((r) => r.id === node.repository.id)),
    newOwnerRepos: []
  };
}
