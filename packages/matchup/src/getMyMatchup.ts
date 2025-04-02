import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export type MyMatchup = Pick<ScoutMatchup, 'submittedAt' | 'totalScore' | 'rank' | 'id'> & {
  scout: {
    id: string;
    displayName: string;
  };
  selections: { developer: Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'>; credits: number }[];
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
              builderNfts: {
                where: {
                  season: getCurrentSeasonStart()
                },
                select: {
                  imageUrl: true
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
        ...selection.developer,
        nftImageUrl: selection.developer.builderNfts[0].imageUrl
      },
      credits: selection.developer.userSeasonStats[0].level || 0
    }))
  };
}
