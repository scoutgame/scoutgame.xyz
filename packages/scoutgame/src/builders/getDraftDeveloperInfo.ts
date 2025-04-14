'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { DateTime } from 'luxon';

import type { DeveloperGithubActivity } from './getDeveloperInfo';

export type DraftDeveloperInfo = {
  id: string;
  path: string;
  displayName: string;
  avatar: string;
  firstContributionDate: Date;
  level: number;
  cardsSold: number;
  gemsCollected: number;
  githubConnectedAt: Date;
  githubLogin: string;
  farcasterUsername: string | null;
  seasonPoints: number;
  scoutedBy: number;
  githubActivities: DeveloperGithubActivity[];
  weeklyRanks: (number | null)[];
};

export async function getDraftDeveloperInfo({
  path,
  scoutId
}: {
  path: string;
  scoutId?: string;
}): Promise<DraftDeveloperInfo | null> {
  if (typeof path !== 'string') {
    log.error('Path is not a string when looking for developer info', { path, scoutId });
    return null;
  }
  const season = getCurrentSeasonStart();
  const oneMonthAgo = DateTime.now().minus({ months: 1 }).toJSDate();

  const developer = await prisma.scout.findUnique({
    where: {
      path,
      builderStatus: {
        in: ['approved', 'banned']
      },
      githubUsers: {
        some: {}
      }
    },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      path: true,
      createdAt: true,
      farcasterName: true,
      githubUsers: {
        select: {
          login: true,
          createdAt: true
        }
      },
      userSeasonStats: {
        where: {
          season
        },
        select: {
          level: true,
          nftsSold: true,
          nftOwners: true,
          pointsEarnedAsBuilder: true
        }
      },
      userWeeklyStats: {
        select: {
          rank: true,
          gemsCollected: true
        }
      },
      events: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 3,
        where: {
          createdAt: {
            gt: oneMonthAgo
          },
          type: {
            in: ['merged_pull_request', 'daily_commit']
          }
        },
        select: {
          createdAt: true,
          gemsReceipt: {
            select: {
              value: true
            }
          },
          githubEvent: {
            select: {
              url: true,
              repo: {
                select: {
                  name: true,
                  owner: true,
                  avatar: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!developer) {
    return null;
  }

  const firstContributionDate = await prisma.githubEvent.findFirst({
    where: {
      builderEvent: {
        builderId: developer.id
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true
    }
  });

  return {
    id: developer.id,
    path: developer.path,
    avatar: developer.avatar as string,
    displayName: developer.displayName,
    firstContributionDate: firstContributionDate?.createdAt || developer.createdAt,
    level: developer.userSeasonStats[0]?.level || 0,
    cardsSold: developer.userSeasonStats[0]?.nftsSold || 0,
    scoutedBy: developer.userSeasonStats[0]?.nftOwners || 0,
    gemsCollected: developer.userWeeklyStats[0]?.gemsCollected || 0,
    githubConnectedAt: developer.githubUsers[0].createdAt,
    githubLogin: developer.githubUsers[0].login,
    farcasterUsername: developer.farcasterName || null,
    seasonPoints: developer.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    githubActivities: developer.events
      .filter((event) => event.githubEvent && event.gemsReceipt)
      .map((event) => ({
        createdAt: event.createdAt,
        avatar: event.githubEvent!.repo.avatar,
        gems: event.gemsReceipt!.value,
        url: event.githubEvent!.url,
        repo: event.githubEvent!.repo.name,
        owner: event.githubEvent!.repo.owner
      })),
    weeklyRanks: developer.userWeeklyStats.map((stat) => stat.rank)
  };
}
