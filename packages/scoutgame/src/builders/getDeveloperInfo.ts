'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
import { DateTime } from 'luxon';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type DeveloperInfo = {
  id: string;
  path: string;
  displayName: string;
  avatar: string;
  firstContributionDate: Date;
  level: number;
  estimatedPayout: number;
  price: bigint;
  rank: number;
  gemsCollected: number;
  githubConnectedAt: Date;
  githubLogin: string;
  farcasterUsername: string | null;
  seasonPoints: number;
  scoutedBy: number;
  cardsSold: number;
  nftImageUrl: string | null;
  congratsImageUrl: string | null;
  githubActivities: {
    repo: string;
    owner: string;
    url: string;
    gems: number;
    createdAt: Date;
    avatar?: string | null;
  }[];
  last14DaysRank: (number | null)[];
};

export async function getDeveloperInfo(path: string): Promise<DeveloperInfo | null> {
  const season = getCurrentSeasonStart();
  const week = getCurrentWeek();
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
        where: {
          week
        },
        select: {
          rank: true,
          gemsCollected: true
        }
      },
      builderCardActivities: {
        select: {
          last14Days: true
        }
      },
      builderNfts: {
        where: {
          season,
          nftType: 'default'
        },
        select: {
          estimatedPayout: true,
          currentPrice: true,
          currentPriceInScoutToken: true,
          imageUrl: true,
          congratsImageUrl: true
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
    estimatedPayout: developer.builderNfts[0]?.estimatedPayout || 0,
    price: isOnchainPlatform()
      ? BigInt(developer.builderNfts[0].currentPriceInScoutToken || 0)
      : BigInt(developer.builderNfts[0].currentPrice || 0),
    rank: developer.userWeeklyStats[0]?.rank || 0,
    gemsCollected: developer.userWeeklyStats[0]?.gemsCollected || 0,
    githubConnectedAt: developer.githubUsers[0].createdAt,
    githubLogin: developer.githubUsers[0].login,
    farcasterUsername: developer.farcasterName || null,
    seasonPoints: developer.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    scoutedBy: developer.userSeasonStats[0]?.nftOwners || 0,
    cardsSold: developer.userSeasonStats[0]?.nftsSold || 0,
    nftImageUrl: developer.builderNfts[0]?.imageUrl || null,
    congratsImageUrl: developer.builderNfts[0]?.congratsImageUrl || null,
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
    last14DaysRank: normalizeLast14DaysRank(developer.builderCardActivities[0])
  };
}
