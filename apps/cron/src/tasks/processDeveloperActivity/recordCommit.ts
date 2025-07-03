import type { ActivityRecipientType, GemsReceiptType, ScoutGameActivityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getStartOfDay, getStartOfWeek, getWeekFromDate } from '@packages/dates/utils';
import type { Commit } from '@packages/github/getCommitsByUser';
import { validMintNftPurchaseEvent } from '@packages/scoutgame/builderNfts/constants';
import { completeQuests } from '@packages/scoutgame/quests/completeQuests';
import { isTruthy } from '@packages/utils/types';

import { gemsValues } from './config';
import { log } from './logger';

export type RequiredCommitFields = Pick<Commit, 'sha' | 'html_url'> & {
  author: Pick<NonNullable<Commit['author']>, 'id' | 'login'> | null;
  commit: Pick<Commit['commit'], 'message'> & {
    author: Pick<Commit['commit']['author'], 'date'>;
    committer: Pick<NonNullable<Commit['commit']['committer']>, 'date'> | null;
  };
  repository: Pick<Commit['repository'], 'id' | 'name' | 'full_name'>;
};

export async function recordCommit({ commit, season }: { commit: RequiredCommitFields; season: Season }) {
  if (!commit.author || !commit.commit.author) {
    log.warn('No commit author', commit);
    return null;
  }
  if (!commit.commit || !commit.commit.committer) {
    log.warn('No committer found', commit);
    return null;
  }
  // this is the date the commit was merged, which determines the season/week that it counts as a builder event
  if (!commit.commit.committer?.date) {
    log.warn('No committer date found', commit);
    return null;
  }
  const builderEventDate = new Date(commit.commit.committer!.date);
  const startOfToday = getStartOfDay(builderEventDate).toJSDate();

  const week = getWeekFromDate(builderEventDate);
  const startOfSeason = getStartOfWeek(season as Season);

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: commit.author.id,
      type: 'commit',
      completedAt: {
        gte: startOfToday
      }
    },
    select: {
      id: true,
      commitHash: true,
      createdAt: true,
      repoId: true,
      createdBy: true,
      type: true,
      builderEvent: {
        select: {
          createdAt: true,
          week: true,
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const existingGithubEvent = previousGitEvents.some((event) => event.commitHash === commit.sha);

  if (existingGithubEvent) {
    // already processed
    return;
  }

  const existingGithubEventToday = previousGitEvents.length > 0;

  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        id: commit.author!.id
      },
      create: {
        id: commit.author!.id,
        login: commit.author!.login
      },
      update: {}
    });

    const event = await tx.githubEvent.create({
      data: {
        commitHash: commit.sha,
        title: commit.commit.message,
        type: 'commit',
        createdBy: commit.author!.id,
        repoId: commit.repository.id,
        url: commit.html_url,
        createdAt: commit.commit.author.date,
        completedAt: commit.commit.committer!.date
      }
    });

    if (githubUser.builderId && !existingGithubEventToday) {
      const gemReceiptType: GemsReceiptType = 'daily_commit';

      const gemValue = gemsValues[gemReceiptType];
      if (builderEventDate >= startOfSeason.toJSDate()) {
        const existingBuilderEvent = await tx.builderEvent.findFirst({
          where: {
            githubEventId: event.id
          },
          select: {
            id: true
          }
        });

        if (!existingBuilderEvent) {
          const activityType: ScoutGameActivityType = 'daily_commit';

          const repo = await prisma.githubRepo.findUniqueOrThrow({
            where: {
              id: commit.repository.id
            },
            select: {
              scoutPartnerId: true
            }
          });

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

          await tx.builderEvent.create({
            data: {
              builderId: githubUser.builderId,
              createdAt: builderEventDate,
              season,
              week,
              type: 'daily_commit',
              githubEventId: event.id,
              scoutPartnerId: repo.scoutPartnerId,
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
        }

        try {
          await completeQuests(githubUser.builderId, ['first-repo-contribution', 'score-first-commit']);
        } catch (error) {
          log.error('Error completing quest for commit', {
            error,
            userId: githubUser.builderId
          });
        }

        log.info('Recorded a commit', {
          eventId: event.id,
          userId: githubUser.builderId,
          week,
          url: commit.html_url,
          sha: commit.sha
        });
      }
    }
  });
}
