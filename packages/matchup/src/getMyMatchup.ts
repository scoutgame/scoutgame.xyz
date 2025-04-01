import type { ScoutMatchup, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';

export type MyMatchup = Pick<ScoutMatchup, 'submittedAt' | 'totalScore' | 'rank'> & {
  scout: {
    displayName: string;
  };
  selections: { developer: Pick<Scout, 'id' | 'displayName' | 'path' | 'avatar'>; credits: number }[];
};

export async function getMyMatchup({
  scoutId,
  week,
  currentWeek = getCurrentWeek()
}: {
  scoutId?: string;
  week: string;
  currentWeek?: string;
}): Promise<MyMatchup | null> {
  if (!scoutId) {
    return null;
  }
  const matchup = await prisma.scoutMatchup.findFirst({
    where: {
      createdBy: scoutId
    },
    select: {
      scout: {
        select: {
          displayName: true
        }
      },
      submittedAt: true,
      totalScore: true,
      rank: true,
      selections: {
        select: {
          developer: {
            select: {
              id: true,
              displayName: true,
              path: true,
              avatar: true,
              userWeeklyStats: {
                where: {
                  week: currentWeek
                },
                select: {
                  rank: true
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
      credits: selection.developer.userWeeklyStats[0].rank || 0
    }))
  };
}
