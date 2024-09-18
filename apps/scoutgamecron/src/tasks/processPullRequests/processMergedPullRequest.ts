import { log } from '@charmverse/core/log';
import type { GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFormattedWeek, getWeekStartEnd, timezone, currentSeason, isSameDay } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';

import { getRecentPullRequestsByUser, type PullRequest } from './getPullRequests';

type RepoInput = Pick<GithubRepo, 'defaultBranch'>;

export async function processMergedPullRequest(pullRequest: PullRequest, repo: RepoInput) {
  const pullRequestDate = new Date(pullRequest.createdAt);
  const { start, end } = getWeekStartEnd(pullRequestDate);
  const week = getFormattedWeek(pullRequestDate);
  const thisWeeksEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.id,
      createdAt: {
        gte: start.toJSDate(),
        lte: end.toJSDate()
      }
    },
    include: {
      builderEvent: {
        include: {
          gemsReceipt: true
        }
      }
    }
  });
  const previousEventCount = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.id,
      repoId: pullRequest.repository.id
    }
  });
  let isFirstPullRequest = previousEventCount === 0;
  if (isFirstPullRequest) {
    // double-check usign Github API in case the previous PR was not recorded by us
    const prs = await getRecentPullRequestsByUser({
      defaultBranch: repo.defaultBranch,
      repoNameWithOwner: pullRequest.repository.nameWithOwner,
      username: pullRequest.author.login
    });
    if (prs.filter((pr) => pr.number !== pullRequest.number).length > 0) {
      isFirstPullRequest = false;
    }
  }
  const previousEventToday = thisWeeksEvents.some((event) => {
    if (event.repoId !== pullRequest.repository.id) {
      return false;
    }

    return isSameDay(event.createdAt);
  });
  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        id: pullRequest.author.id
      },
      create: {
        id: pullRequest.author.id,
        login: pullRequest.author.login
      },
      update: {}
    });
    const event = await tx.githubEvent.upsert({
      where: {
        unique_github_event: {
          pullRequestNumber: pullRequest.number,
          createdBy: pullRequest.author.id,
          type: 'merged_pull_request',
          repoId: pullRequest.repository.id
        }
      },
      create: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.id,
        isFirstPullRequest,
        repoId: pullRequest.repository.id,
        url: pullRequest.url
      },
      update: {}
    });
    if (githubUser.builderId && !previousEventToday) {
      const gemReceiptType = isFirstPullRequest ? 'first_pr' : 'regular_pr';
      const gemValue = gemReceiptType === 'first_pr' ? 10 : 1;
      await tx.builderEvent.upsert({
        where: {
          githubEventId: event.id
        },
        create: {
          builderId: githubUser.builderId,
          season: currentSeason,
          week,
          type: 'merged_pull_request',
          githubEventId: event.id,
          gemsReceipt: {
            create: {
              type: gemReceiptType,
              value: gemValue
            }
          }
        },
        update: {}
      });
      const gemsCollected = thisWeeksEvents.reduce((acc, e) => {
        if (e.builderEvent?.gemsReceipt?.value) {
          return acc + e.builderEvent.gemsReceipt.value;
        }
        return acc;
      }, gemValue);
      await tx.userWeeklyStats.upsert({
        where: {
          userId_week: {
            userId: githubUser.builderId,
            week
          }
        },
        create: {
          userId: githubUser.builderId,
          week,
          gemsCollected
        },
        update: {
          gemsCollected
        }
      });
      log.info('Recorded a merged PR', { userId: githubUser.builderId, url: pullRequest.url, gemsCollected });
    }
  });
}
