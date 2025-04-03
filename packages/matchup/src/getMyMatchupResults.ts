import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getShortenedRelativeTime } from '@packages/utils/dates';

type DeveloperMeta = Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'> & {
  events: { gemsCollected: number; url: string; repoFullName: string; contributionType: string; createdAt: string }[];
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
          developer: {
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
  });
  if (!matchup) {
    return null;
  }
  const developers: DeveloperMeta[] = matchup.selections
    .map((selection) => ({
      ...selection.developer,
      events: selection.developer.events.map((event) => ({
        createdAt: getShortenedRelativeTime(event.createdAt)!,
        gemsCollected: event.gemsReceipt!.value,
        url: event.githubEvent?.url || '',
        repoFullName: event.githubEvent ? extractRepoFullName(event.githubEvent?.url) : '',
        contributionType: event.gemsReceipt!.type
      })),
      totalGemsCollected: selection.developer.events.reduce((acc, event) => {
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
