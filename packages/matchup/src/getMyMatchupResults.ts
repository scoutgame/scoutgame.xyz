import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getActivityLabel } from '@packages/scoutgame/builders/getActivityLabel';
import type { BuilderActivity, OnchainAchievementActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { getShortenedRelativeTime } from '@packages/utils/dates';

type DeveloperMeta = Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'> & {
  events: {
    gemsCollected: number;
    url: string;
    repoFullName: string;
    contributionType: string;
    createdAt: string;
  }[];
  totalGemsCollected: number;
};

export type MyMatchup = Pick<ScoutMatchup, 'submittedAt' | 'totalScore' | 'rank' | 'id'> & {
  scout: {
    id: string;
    displayName: string;
  };
  totalGemsCollected: number;
  developers: DeveloperMeta[];
};

export async function getMyMatchupResults({
  scoutId,
  week
}: {
  scoutId?: string;
  week: string;
}): Promise<MyMatchup | null> {
  if (!scoutId) {
    return null;
  }
  const matchup = await prisma.scoutMatchup.findUnique({
    where: {
      createdBy_week: {
        createdBy: scoutId,
        week
      }
    },
    select: {
      id: true,
      scout: {
        select: {
          id: true,
          displayName: true
        }
      },
      submittedAt: true,
      totalScore: true,
      rank: true,
      week: true,
      selections: {
        select: {
          developerNft: {
            select: {
              builder: {
                select: {
                  id: true,
                  displayName: true,
                  path: true,
                  avatar: true,
                  events: {
                    where: {
                      week,
                      type: {
                        in: ['daily_commit', 'merged_pull_request', 'onchain_achievement']
                      }
                    },
                    orderBy: {
                      createdAt: 'desc'
                    },
                    select: {
                      createdAt: true,
                      githubEvent: {
                        select: {
                          url: true
                        }
                      },
                      onchainAchievement: {
                        select: {
                          tier: true
                        }
                      },
                      gemsReceipt: {
                        select: {
                          type: true,
                          value: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  if (!matchup) {
    return null;
  }
  const developers: DeveloperMeta[] = matchup.selections
    .map((selection) => ({
      ...selection.developerNft.builder,
      events: selection.developerNft.builder.events.map((event) => ({
        createdAt: getShortenedRelativeTime(event.createdAt)!,
        gemsCollected: event.gemsReceipt!.value,
        url: event.githubEvent?.url || '',
        repoFullName: event.githubEvent ? extractRepoFullName(event.githubEvent?.url) : '',
        // @ts-ignore -- this is a temporary fix to get the correct type without unecssary data
        contributionType: getActivityLabel({
          type: event.githubEvent ? 'github_event' : ('onchain_achievement' as const),
          contributionType: event.gemsReceipt!.type,
          tier: event.onchainAchievement?.tier
        }) as string
      })),
      totalGemsCollected: selection.developerNft.builder.events.reduce((acc, event) => {
        if (event.gemsReceipt) {
          return acc + event.gemsReceipt.value;
        }
        return acc;
      }, 0)
    }))
    .sort((a, b) => b.totalGemsCollected - a.totalGemsCollected);

  const totalGemsCollected = developers.reduce((acc, developer) => acc + developer.totalGemsCollected, 0);
  return {
    ...matchup,
    totalGemsCollected,
    developers
  };
}

// example: https://github.com/scoutgame/scoutgame.xyz/pull/461
function extractRepoFullName(url: string) {
  const parts = url.split('/');
  return `${parts[3]}/${parts[4]}`;
}
