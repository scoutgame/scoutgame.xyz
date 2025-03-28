import type { ActivityRecipientType, GithubRepo, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendDiscordEvent } from '@packages/discord/sendDiscordEvent';
import type { PullRequest } from '@packages/github/getPullRequestsByUser';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { sendNotifications } from '@packages/scoutgame/notifications/sendNotifications';
import { attestDeveloperStatusEvent } from '@packages/scoutgameattestations/attestDeveloperStatusEvent';
import { isTruthy } from '@packages/utils/types';
import { v4 as uuid } from 'uuid';

import { getClosedPullRequest } from './github/getClosedPullRequest';
import { log } from './logger';

type RepoInput = Pick<GithubRepo, 'owner' | 'name'>;

export type ClosedPullRequestMeta = Pick<
  PullRequest,
  'author' | 'number' | 'title' | 'repository' | 'url' | 'createdAt' | 'closedAt'
>;

export async function recordClosedPullRequest({
  pullRequest,
  season,
  repo,
  prClosedBy,
  skipSendingComment
}: {
  pullRequest: ClosedPullRequestMeta;
  repo: RepoInput;
  season: string;
  prClosedBy?: string;
  skipSendingComment?: boolean;
}) {
  const builder = await prisma.scout.findFirst({
    where: {
      githubUsers: {
        some: {
          id: pullRequest.author.id
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true,
      path: true,
      builderStatus: true,
      strikes: {
        select: {
          id: true,
          githubEvent: {
            select: {
              title: true,
              url: true,
              createdAt: true,
              repo: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
  if (builder) {
    // Check if this PR was closed by the author, then ignore it
    const { login: prClosingAuthorUsername } = prClosedBy
      ? { login: prClosedBy }
      : await getClosedPullRequest({
          pullRequestNumber: pullRequest.number,
          repo
        });

    const ignoreStrike = prClosingAuthorUsername === pullRequest.author.login;
    if (ignoreStrike) {
      log.debug('Ignore CLOSED PR since the author closed it', { url: pullRequest.url });
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

    const strikesCount = await prisma.builderStrike.count({
      where: {
        builderId: builder.id,
        deletedAt: null
      }
    });
    const currentStrikesCount = strikesCount + 1;
    const shouldBeBanned = currentStrikesCount >= 3;
    const strikeId = uuid();

    const nftPurchaseEvents = await prisma.nFTPurchaseEvent.findMany({
      where: {
        ...validMintNftPurchaseEvent,
        builderNft: {
          season,
          builderId: builder.id
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

    const activityType = (shouldBeBanned ? 'builder_suspended' : 'builder_strike') as ScoutGameActivityType;

    await prisma.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'closed_pull_request',
        createdBy: pullRequest.author.id,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        strike: ignoreStrike
          ? undefined
          : {
              create: {
                id: strikeId,
                builderId: builder.id,
                activities: {
                  createMany: {
                    data: [
                      ...uniqueScoutIds.map((scoutId) => ({
                        recipientType: 'scout' as ActivityRecipientType,
                        userId: scoutId,
                        type: activityType,
                        createdAt: pullRequest.closedAt
                      })),
                      {
                        recipientType: 'builder' as ActivityRecipientType,
                        userId: builder.id,
                        type: activityType,
                        createdAt: pullRequest.closedAt
                      }
                    ]
                  }
                }
              }
            },
        createdAt: pullRequest.createdAt,
        completedAt: pullRequest.closedAt
      }
    });

    if (ignoreStrike) {
      return;
    }

    log.info('Recorded a closed PR', { userId: builder.id, url: pullRequest.url, strikes: currentStrikesCount });

    if (shouldBeBanned && builder.builderStatus !== 'banned') {
      await prisma.scout.update({
        where: {
          id: builder.id
        },
        data: {
          builderStatus: 'banned'
        }
      });

      await attestDeveloperStatusEvent({
        builderId: builder.id,
        event: {
          type: 'banned',
          description: `${builder.displayName} banned for season ${getCurrentSeasonStart()}`,
          season: getCurrentSeasonStart()
        }
      });

      const events = builder.strikes
        .map((strike) => strike.githubEvent)
        .filter(isTruthy)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      try {
        await sendNotifications({
          userId: builder.id,
          notificationType: 'builder_suspended',
          email: {
            templateVariables: {
              builder_name: builder.displayName,
              repo_1_title: events[0].repo.name,
              pr_1_link: events[0].url,
              pr_1_title: events[0].title,
              repo_2_title: events[1].repo.name,
              pr_2_link: events[1].url,
              pr_2_title: events[1].title,
              repo_3_title: events[2].repo.name,
              pr_3_link: events[2].url,
              pr_3_title: events[2].title
            }
          },
          farcaster: {
            templateVariables: undefined
          },
          app: {
            templateVariables: undefined
          }
        });

        await sendDiscordEvent({
          title: '🚨 Builder Suspended',
          description: `Builder ${builder.displayName} has been suspended`,
          fields: [
            {
              name: 'Profile',
              value: `https://scoutgame.xyz/u/${builder.path}`
            },
            { name: 'Strikes', value: currentStrikesCount.toString() }
          ]
        });

        log.info('Banned builder', { userId: builder.id, strikes: currentStrikesCount });
      } catch (error) {
        log.error('Error sending email to banned builder', { error, userId: builder.id });
      }
    }
  }
}
