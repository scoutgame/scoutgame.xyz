import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { normalizeLast14DaysRank } from '@packages/scoutgame/builders/utils/normalizeLast14DaysRank';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { isOnchainPlatform } from '@packages/utils/platform';

export type MyMatchup = Pick<ScoutMatchup, 'submittedAt' | 'totalScore' | 'rank' | 'id'> & {
  scout: {
    id: string;
    displayName: string;
  };
  selections: {
    developer: Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'> & {
      gemsCollected: number;
      level: number;
      estimatedPayout: number;
      last14DaysRank: (number | null)[];
    };
    credits: number;
  }[];
};

export async function getMyMatchup({ scoutId, week }: { scoutId?: string; week: string }): Promise<MyMatchup | null> {
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
              builderCardActivities: {
                select: {
                  last14Days: true
                }
              },
              builderNfts: {
                where: {
                  season: getCurrentSeasonStart()
                },
                select: {
                  imageUrl: true,
                  estimatedPayoutDevToken: true,
                  estimatedPayout: true
                }
              },
              userWeeklyStats: {
                where: {
                  week
                },
                select: {
                  gemsCollected: true
                }
              },
              userSeasonStats: {
                where: {
                  season: getCurrentSeasonStart()
                },
                select: {
                  level: true
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
  return {
    ...matchup,
    selections: matchup.selections.map((selection) => ({
      ...selection,
      developer: {
        id: selection.developer.id,
        displayName: selection.developer.displayName,
        path: selection.developer.path,
        avatar: selection.developer.avatar,
        nftImageUrl: selection.developer.builderNfts[0].imageUrl,
        gemsCollected: selection.developer.userWeeklyStats[0].gemsCollected,
        level: selection.developer.userSeasonStats[0].level,
        estimatedPayout: isOnchainPlatform()
          ? Number(
              BigInt(selection.developer.builderNfts?.[0]?.estimatedPayoutDevToken ?? 0) /
                BigInt(10 ** devTokenDecimals)
            )
          : (selection.developer.builderNfts?.[0]?.estimatedPayout ?? 0),
        last14DaysRank: normalizeLast14DaysRank(selection.developer.builderCardActivities[0])
      },
      credits: selection.developer.userSeasonStats[0].level || 0
    }))
  };
}
