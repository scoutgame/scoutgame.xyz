import { log } from '@charmverse/core/log';
import type {
  ActivityRecipientType,
  GemsReceiptType,
  GithubRepo,
  ScoutGameActivityType
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { streakWindow } from '@packages/dates/config';
import { getStartOfWeek, getWeekFromDate, isToday } from '@packages/dates/utils';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { completeQuests } from '@packages/scoutgame/quests/completeQuests';
import type { QuestType } from '@packages/scoutgame/quests/questRecords';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import { gemsValues } from './config';
import type { PullRequest } from './github/getPullRequestsByUser';
import { getRecentMergedPullRequestsByUser } from './github/getRecentMergedPullRequestsByUser';

type RepoInput = Pick<GithubRepo, 'defaultBranch' | 'bonusPartner'>;

export type MergedPullRequestMeta = Pick<
  PullRequest,
  'author' | 'number' | 'title' | 'repository' | 'url' | 'createdAt' | 'mergedAt' | 'mergeCommit' | 'reviewDecision'
>;

/**
 *
 * @isFirstMergedPullRequest Only used for the seed data generator
 */
export async function recordMergedPullRequest({
  pullRequest,
  repo,
  season,
  skipFirstMergedPullRequestCheck,
  now = DateTime.utc()
}: {
  pullRequest: MergedPullRequestMeta;
  repo: RepoInput;
  skipFirstMergedPullRequestCheck?: boolean;
  season: Season;
  now?: DateTime;
}) {
  if (!pullRequest.mergedAt) {
    throw new Error('Pull request was not merged');
  }
  // this is the date the PR was merged, which determines the season/week that it counts as a builder event
  const pullRequestDate = new Date(pullRequest.mergedAt!);
  const builderEventDate = pullRequestDate;
  const week = getWeekFromDate(builderEventDate);
  const seasonStart = getStartOfWeek(season as Season);

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.id,
      // streaks are based on merged date
      completedAt: {
        gte: new Date(pullRequestDate.getTime() - streakWindow)
      },
      type: 'merged_pull_request'
    },
    select: {
      id: true,
      completedAt: true,
      pullRequestNumber: true,
      repoId: true,
      createdBy: true,
      builderEvent: {
        select: {
          createdAt: true,
          week: true,
          gemsReceipt: {
            select: {
              value: true,
              type: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const existingGithubEvent = previousGitEvents.some(
    (event) => event.pullRequestNumber === pullRequest.number && event.repoId === pullRequest.repository.id
  );

  if (existingGithubEvent) {
    // already processed
    return { githubEvent: null, builderEvent: null };
  }

  // check our data to see if this is the first merged PR in a repo in the last 7 days, and if so, check the Github API to confirm
  const totalMergedPullRequests = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.id,
      repoId: pullRequest.repository.id,
      type: 'merged_pull_request'
    }
  });

  const recentFirstMergedPullRequests = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.id,
      type: 'merged_pull_request',
      isFirstPullRequest: true,
      builderEvent: {
        week
      }
    }
  });
  const hasFirstMergedPullRequestAlreadyThisWeek = recentFirstMergedPullRequests > 0;

  let isFirstMergedPullRequest = totalMergedPullRequests === 0;
  if (isFirstMergedPullRequest && !skipFirstMergedPullRequestCheck) {
    // double-check using Github API in case the previous PR was not recorded by us
    const prs = await getRecentMergedPullRequestsByUser({
      defaultBranch: repo.defaultBranch,
      repoNameWithOwner: pullRequest.repository.nameWithOwner,
      username: pullRequest.author.login
    });
    if (
      prs.filter((pr) => pr.number !== pullRequest.number || pr.repository.owner.login === pullRequest.author.login)
        .length > 0
    ) {
      isFirstMergedPullRequest = false;
    }
  }

  return prisma.$transaction(async (tx) => {
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

    const event = await tx.githubEvent.create({
      data: {
        commitHash: pullRequest.mergeCommit?.oid,
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.id,
        isFirstPullRequest: isFirstMergedPullRequest,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        createdAt: pullRequest.createdAt,
        completedAt: pullRequest.mergedAt
      }
    });
    if (githubUser.builderId) {
      const builder = await tx.scout.findUniqueOrThrow({
        where: {
          id: githubUser.builderId
        },
        select: {
          builderStatus: true
        }
      });

      if (builder.builderStatus !== 'approved') {
        log.warn('Ignore PR: builder not approved', { eventId: event.id, userId: githubUser.builderId });
        return;
      }
      const previousStreakEvent = previousGitEvents.find(
        (e) => e.builderEvent?.gemsReceipt?.type === 'third_pr_in_streak'
      );
      const previousStreakEventDate = previousStreakEvent?.completedAt?.toISOString().split('T')[0];
      const previousDaysWithPr = new Set(
        previousGitEvents
          .filter((e) => e.builderEvent)
          .map((e) => e.completedAt && e.completedAt.toISOString().split('T')[0])
          .filter(isTruthy)
          // We only grab events from the last 7 days, so what looked like a streak may change over time
          // To address this, we filter out events that happened before a previous streak event
          .filter((dateStr) => !previousStreakEventDate || dateStr > previousStreakEventDate)
      );

      const thisPrDate = builderEventDate.toISOString().split('T')[0];
      const isFirstPrToday = !previousDaysWithPr.has(thisPrDate);
      const threeDayPrStreak = isFirstPrToday && previousDaysWithPr.size % 3 === 2;

      const gemReceiptType: GemsReceiptType =
        isFirstMergedPullRequest && !hasFirstMergedPullRequestAlreadyThisWeek
          ? 'first_pr'
          : threeDayPrStreak
            ? 'third_pr_in_streak'
            : pullRequest.reviewDecision === 'APPROVED'
              ? 'regular_pr'
              : isFirstPrToday
                ? 'regular_pr' // we count this differently because it's the first PR of the day
                : 'regular_pr_unreviewed';

      const gemValue = gemsValues[gemReceiptType];

      if (builderEventDate >= seasonStart.toJSDate()) {
        const existingBuilderEvent = await tx.builderEvent.findFirst({
          where: {
            githubEventId: event.id
          },
          select: {
            id: true
          }
        });

        if (!existingBuilderEvent) {
          const activityType = (
            gemReceiptType === 'first_pr'
              ? 'gems_first_pr'
              : gemReceiptType === 'third_pr_in_streak'
                ? 'gems_third_pr_in_streak'
                : 'gems_regular_pr'
          ) as ScoutGameActivityType;

          // It's a new event, we can record notification
          const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
            where: {
              ...validMintNftPurchaseEvent,
              builderNft: {
                season,
                builderId: githubUser.builderId
              }
            },
            select: {
              scoutWallet: {
                select: {
                  scoutId: true
                }
              }
            }
          });

          const uniqueScoutIds = Array.from(
            new Set(nftPurchaseEvents.map((nftPurchaseEvent) => nftPurchaseEvent.scoutWallet!.scoutId).filter(isTruthy))
          );
          const builderEvent = await tx.builderEvent.create({
            data: {
              builderId: githubUser.builderId,
              createdAt: builderEventDate,
              season,
              week,
              type: 'merged_pull_request',
              githubEventId: event.id,
              bonusPartner: repo.bonusPartner,
              gemsReceipt: {
                create: {
                  type: gemReceiptType,
                  value: gemValue,
                  createdAt: builderEventDate,
                  activities: {
                    createMany: {
                      data: [
                        ...uniqueScoutIds.map((scoutId) => ({
                          recipientType: 'scout' as ActivityRecipientType,
                          userId: scoutId,
                          type: activityType,
                          createdAt: builderEventDate
                        })),
                        {
                          recipientType: 'builder' as ActivityRecipientType,
                          userId: githubUser.builderId,
                          type: activityType,
                          createdAt: builderEventDate
                        }
                      ]
                    }
                  }
                }
              }
            }
          });

          try {
            const questTypes: QuestType[] = [];
            if (activityType === 'gems_third_pr_in_streak') {
              questTypes.push('score-streak');
            }
            // First PR is the first contribution to a repo
            else if (activityType === 'gems_first_pr') {
              questTypes.push('score-first-pr');
              questTypes.push('first-repo-contribution');
            }

            if (repo.bonusPartner === 'game7') {
              questTypes.push('contribute-game7-repo');
            } else if (repo.bonusPartner === 'celo') {
              questTypes.push('contribute-celo-repo');
            }

            if (questTypes.length) {
              await completeQuests(githubUser.builderId, questTypes);
            }
          } catch (error) {
            log.error('Error completing quest for merged PR', { error, userId: githubUser.builderId, activityType });
          }

          return { builderEvent, githubEvent: event };
        }
      } else {
        log.warn('Ignore PR: PR is not in current season', { eventId: event.id, userId: githubUser.builderId });
      }
    }
    return { builderEvent: null, githubEvent: event };
  });
}
