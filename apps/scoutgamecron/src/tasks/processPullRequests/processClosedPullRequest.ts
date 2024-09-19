import { log } from '@charmverse/core/log';
import type { GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getClosedPullRequest } from './getClosedPullRequest';
import type { PullRequest } from './getPullRequests';
import { octokit } from './githubClient';

type RepoInput = Pick<GithubRepo, 'owner' | 'name'>;

export async function processClosedPullRequest(pullRequest: PullRequest, repo: RepoInput) {
  const builder = await prisma.scout.findFirst({
    where: {
      githubUser: {
        some: {
          id: pullRequest.author.id
        }
      },
      builder: true
    },
    select: {
      id: true,
      bannedAt: true,
      strikes: {
        select: {
          id: true
        }
      }
    }
  });

  if (builder) {
    let ignoreStrike = false;
    // Check if this PR was closed by the author, then ignore it
    const { login: prClosingAuthorUsername } = await getClosedPullRequest({
      pullRequestNumber: pullRequest.number,
      repo
    });
    if (prClosingAuthorUsername === pullRequest.author.login) {
      log.debug('Ignore CLOSED PR since the author closed it', { url: pullRequest.url });
      ignoreStrike = true;
    }

    const existingGithubEvent = await prisma.githubEvent.findFirst({
      where: {
        pullRequestNumber: pullRequest.number,
        createdBy: pullRequest.author.id,
        type: 'closed_pull_request',
        repoId: pullRequest.repository.id
      }
    });

    if (existingGithubEvent) {
      log.debug('Ignore CLOSED PR since it was already processed', { url: pullRequest.url });
      return;
    }

    await prisma.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: pullRequest.state === 'CLOSED' ? 'closed_pull_request' : 'merged_pull_request',
        createdBy: pullRequest.author.id,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        strike: ignoreStrike
          ? undefined
          : {
              create: {
                builderId: builder.id
              }
            }
      }
    });

    if (ignoreStrike) {
      return;
    }

    const strikes = await prisma.builderStrike.count({
      where: {
        builderId: builder.id,
        deletedAt: null
      }
    });

    const shouldBeBanned = strikes >= 3;

    log.info('Recorded a closed PR', { userId: builder.id, url: pullRequest.url, strikes });

    if (shouldBeBanned && !builder.bannedAt) {
      await prisma.scout.update({
        where: {
          id: builder.id
        },
        data: {
          bannedAt: new Date()
        }
      });
      await octokit.rest.issues.createComment({
        issue_number: pullRequest.number,
        body: `Scout Game Alert: ⚠️

It looks like this Pull Request was closed by the maintainer. As a result, you've received your third strike in the Scout Game. Your current strike count is 3, and your account has been suspended from further participation in the Scout Game.

If you believe this was a mistake and wish to appeal, you can submit an appeal at: app.charmverse.io.
`,
        owner: repo.owner,
        repo: repo.name
      });
      log.info('Banned builder', { userId: builder.id, strikes });
    } else if (!shouldBeBanned) {
      await octokit.rest.issues.createComment({
        issue_number: pullRequest.number,
        body: `Scout Game Alert: ⚠️
        
It looks like this Pull Request was closed by the maintainer. As a result, you've received your first strike in the Scout Game. Your current strike count is ${strikes}.

Please note that if you reach 3 strikes, your account will be suspended from the Scout Game.

If you believe this was a mistake and wish to appeal now or after 3 strikes, you can submit an appeal at: app.charmverse.io.
`,
        owner: repo.owner,
        repo: repo.name
      });
    }
  }
}