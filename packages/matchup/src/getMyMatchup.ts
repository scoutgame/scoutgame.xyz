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
  const season = getCurrentSeasonStart(week);
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
              imageUrl: true,
              estimatedPayoutDevToken: true,
              estimatedPayout: true,
              builder: {
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
                      season
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
      }
    }
  });
  if (!matchup) {
    return null;
  }
  const selections = matchup.selections
    .map((selection) => ({
      ...selection,
      developer: {
        id: selection.developerNft.builder.id,
        displayName: selection.developerNft.builder.displayName,
        path: selection.developerNft.builder.path,
        avatar: selection.developerNft.builder.avatar,
        nftImageUrl: selection.developerNft.imageUrl,
        gemsCollected: selection.developerNft.builder.userWeeklyStats[0]?.gemsCollected || 0,
        level: selection.developerNft.builder.userSeasonStats[0]?.level || 0,
        estimatedPayout: isOnchainPlatform()
          ? Number(BigInt(selection.developerNft.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
          : (selection.developerNft.estimatedPayout ?? 0),
        last14DaysRank: normalizeLast14DaysRank(selection.developerNft.builder.builderCardActivities[0])
      },
      credits: selection.developerNft.builder.userSeasonStats[0].level || 0
    }))
    .sort((a, b) => b.developer.level - a.developer.level);
  return {
    ...matchup,
    selections
  };
}
