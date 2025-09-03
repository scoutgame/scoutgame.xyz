import type {
  ActivityRecipientType,
  GemsReceiptType,
  GithubRepo,
  ScoutGameActivityType
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { streakWindow } from '@packages/dates/config';
import { getStartOfWeek, getWeekFromDate } from '@packages/dates/utils';
import type { PullRequest } from '@packages/github/getPullRequestsByUser';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { sendNotifications } from '@packages/scoutgame/notifications/sendNotifications';
import { getPartnerRewardAmount } from '@packages/scoutgame/scoutPartners/getPartnerRewardAmount';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';
import { formatUnits } from 'viem';

import { gemsValues } from './config';
import { getLinkedIssue } from './github/getLinkedIssue';
import { getRecentMergedPullRequestsByUser } from './github/getRecentMergedPullRequestsByUser';
import { log } from './logger';

type RepoInput = Pick<GithubRepo, 'defaultBranch' | 'scoutPartnerId'>;

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

    // Add linked issues processing

    if (githubUser.builderId) {
      let issueTags: string[] | null = null;

      const scoutPartner = repo.scoutPartnerId
        ? await prisma.scoutPartner.findUniqueOrThrow({
            where: {
              status: 'active',
              id: repo.scoutPartnerId,
              blacklistedDevelopers: {
                none: {
                  developerId: githubUser.builderId
                }
              }
            }
          })
        : null;

      if (scoutPartner) {
        try {
          const [owner, repoName] = pullRequest.repository.nameWithOwner.split('/');
          const linkedIssue = await getLinkedIssue({
            owner,
            repo: repoName,
            pullNumber: pullRequest.number
          });

          if (linkedIssue) {
            await tx.githubIssue.create({
              data: {
                pullRequestNumber: pullRequest.number,
                githubEventId: event.id,
                repoId: pullRequest.repository.id,
                issueNumber: linkedIssue.number,
                tags: linkedIssue.tags
              }
            });
            issueTags = linkedIssue.tags;
          }
        } catch (error) {
          log.error('Error processing linked issues', {
            error,
            pullRequestNumber: pullRequest.number,
            repository: pullRequest.repository.nameWithOwner
          });
        }
      }

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
      const streakEvent = previousGitEvents.find((e) => e.builderEvent?.gemsReceipt?.type === 'third_pr_in_streak');
      const streakEventDate = streakEvent?.completedAt?.toISOString().split('T')[0];
      const daysWithPr = new Set(
        previousGitEvents
          .filter((e) => e.builderEvent)
          .map((e) => e.completedAt && e.completedAt.toISOString().split('T')[0])
          .filter(isTruthy)
          // We only grab events from the last 7 days, so what looked like a streak may change over time
          // To address this, we filter out events that happened before a previous streak event
          .filter((dateStr) => !streakEventDate || dateStr > streakEventDate)
      );

      const thisPrDate = builderEventDate.toISOString().split('T')[0];
      const isFirstPrToday = !daysWithPr.has(thisPrDate);
      const isFirstPrTodayFromThisRepo = previousGitEvents
        .filter((e) => e.repoId === pullRequest.repository.id)
        .every((e) => e.completedAt?.toISOString().split('T')[0] !== thisPrDate);
      const threeDayPrStreak = isFirstPrToday && daysWithPr.size % 3 === 2;

      const gemReceiptType: GemsReceiptType = isFirstMergedPullRequest
        ? 'first_pr'
        : threeDayPrStreak
          ? 'third_pr_in_streak'
          : pullRequest.reviewDecision === 'APPROVED'
            ? 'regular_pr'
            : 'regular_pr_unreviewed';

      const gemValue =
        // count the first PR of the day the same as a regular PR
        gemReceiptType === 'regular_pr_unreviewed' && isFirstPrTodayFromThisRepo
          ? gemsValues.regular_pr
          : gemsValues[gemReceiptType];

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
              scoutPartnerId: scoutPartner?.id,
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

          let rewardAmount = '';
          let rewardToken = '';

          if (scoutPartner && scoutPartner.tokenSymbol && scoutPartner.tokenDecimals) {
            rewardAmount = formatUnits(
              getPartnerRewardAmount({
                scoutPartner,
                tags: issueTags
              }),
              scoutPartner.tokenDecimals
            );
            rewardToken = scoutPartner.tokenSymbol!;
          }

          try {
            await sendNotifications({
              userId: githubUser.builderId,
              notificationType: 'merged_pr_gems',
              email: {
                templateVariables: {
                  builder_name: githubUser.displayName as string,
                  pr_title: pullRequest.title,
                  pr_link: pullRequest.url,
                  gems_value: gemValue,
                  partner_rewards: scoutPartner
                    ? `<p>You also earned <strong style="font-family: 'Arial', sans-serif;">${rewardAmount}</strong> <img style="width: 16px; height: 16px; vertical-align: -2px;" src="${scoutPartner.tokenImage}"/> from our partner <a style="text-decoration: underline; color: #3a3a3a;" href="https://scoutgame.xyz/info/partner-rewards/${scoutPartner.id}">${scoutPartner.name}</a></p>`
                    : ''
                }
              },
              farcaster: {
                templateVariables: {
                  gems: gemValue,
                  partnerRewards: rewardAmount && rewardToken ? `${rewardAmount} ${rewardToken}` : undefined
                }
              },
              app: {
                templateVariables: {
                  gems: gemValue,
                  partnerRewards: rewardAmount && rewardToken ? `${rewardAmount} ${rewardToken}` : undefined
                }
              }
            });
          } catch (error) {
            log.error('Error sending merged PR gems email to builder', { error, userId: githubUser.builderId });
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
