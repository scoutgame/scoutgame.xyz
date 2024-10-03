import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';

import { getPullRequests } from './getPullRequests';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';
import { updateBuildersRank } from './updateBuildersRank';

export async function processPullRequests({
  createdAfter = new Date(Date.now() - 30 * 60 * 1000),
  skipClosedPrProcessing = false,
  season = currentSeason
}: { createdAfter?: Date; skipClosedPrProcessing?: boolean; season?: string } = {}) {
  const repos = await prisma.githubRepo.findMany({
    where: {
      deletedAt: null
    },
    select: {
      owner: true,
      name: true,
      defaultBranch: true
    }
  });
  log.info(`Found ${repos.length} repos to check for PRs`);

  const timer = DateTime.now();
  const pullRequests = await getPullRequests({ repos, after: createdAfter });

  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      createdAt: {
        gt: createdAfter
      }
    }
  });
  const newPullRequests = pullRequests.filter((pr) =>
    githubEvents.some((e) => e.pullRequestNumber === pr.number && e.repoId === pr.repository.id)
  );

  const uniqueRepos = Array.from(new Set(pullRequests.map((pr) => pr.repository.id)));

  // pullRequests.map((pr) => pr.repository.id);

  log.info(
    `Retrieved ${newPullRequests.length} new PRs (out of ${pullRequests.length}) across ${
      uniqueRepos.length
    } repos in ${timer.diff(DateTime.now(), 'minutes')} minutes`
  );

  let i = 0;

  for (const pullRequest of pullRequests) {
    i += 1;
    log.info(
      `Processing PR ${i}/${pullRequests.length}  // ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`
    );
    const repo = repos.find((r) => `${r.owner}/${r.name}` === pullRequest.repository.nameWithOwner);
    if (!repo) {
      throw new Error(`Repo not found: ${pullRequest.repository.nameWithOwner}`);
    }

    try {
      if (pullRequest.state === 'CLOSED') {
        if (!skipClosedPrProcessing) {
          await processClosedPullRequest({ pullRequest, repo, season });
        }
      } else {
        await processMergedPullRequest({ pullRequest, repo, season });
      }
    } catch (error) {
      log.error(`Error processing ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`, { error });
    }
  }

  await updateBuildersRank({ week: getCurrentWeek() });

  log.info(`Processed ${pullRequests.length} pull requests in ${timer.diff(DateTime.now(), 'minutes')} minutes`);
}
