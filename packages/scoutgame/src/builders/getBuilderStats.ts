import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

export type BuilderStats = {
  seasonTokens?: number;
  allTimeTokens?: number;
  rank: number | null;
  gemsCollected?: number;
};

export async function getBuilderStats(builderId: string): Promise<BuilderStats> {
  const builder = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      userSeasonStats: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          rank: true,
          gemsCollected: true
        }
      }
    }
  });

  return {
    seasonTokens: builder.userSeasonStats[0]?.pointsEarnedAsBuilder,
    allTimeTokens: builder.userAllTimeStats[0]?.pointsEarnedAsBuilder,
    rank: builder.userWeeklyStats[0]?.rank,
    gemsCollected: builder.userWeeklyStats[0]?.gemsCollected
  };
}
