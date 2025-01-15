import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

export type BuilderAggregateScore = {
  builderId: string;
  totalPoints: number;
  firstActiveWeek: ISOWeek;
  level: number;
  centile: number;
  averageGemsPerWeek: number;
};

export const decileTable = [
  { cutoff: 90, level: 10 },
  { cutoff: 80, level: 9 },
  { cutoff: 70, level: 8 },
  { cutoff: 60, level: 7 },
  { cutoff: 50, level: 6 },
  { cutoff: 40, level: 5 },
  { cutoff: 30, level: 4 },
  { cutoff: 20, level: 3 },
  { cutoff: 10, level: 2 },
  { cutoff: 0, level: 1 }
];

export async function calculateBuilderLevels({
  season = getCurrentSeasonStart()
}: {
  season?: ISOWeek;
} = {}): Promise<BuilderAggregateScore[]> {
  let allSeasonWeeks = getAllISOWeeksFromSeasonStart({ season });

  // Filter out current week if season is the current season. We only want the historical data
  if (season === getCurrentSeasonStart()) {
    const currentWeek = getCurrentWeek();
    allSeasonWeeks = allSeasonWeeks.filter((week) => week < currentWeek);
  }

  // Fetch all builders with their GemReceipts
  const gemPayouts = await prisma.gemsPayoutEvent.findMany({
    where: {
      points: {
        gt: 0
      },
      builderEvent: {
        season,
        week: {
          in: allSeasonWeeks
        },
        type: 'gems_payout',
        builder: {
          builderNfts: {
            some: {
              season
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      points: true,
      week: true,
      builderId: true,
      builder: {
        select: {
          path: true
        }
      }
    }
  });

  const builderScores = gemPayouts.reduce(
    (acc, receipt) => {
      const builderId = receipt.builderId;

      // Ignore empty gem payouts
      if (!receipt.points) {
        return acc;
      }

      if (!acc[builderId]) {
        acc[builderId] = {
          builderId,
          totalPoints: 0,
          firstActiveWeek: receipt.week,
          centile: 0,
          level: 0,
          averageGemsPerWeek: 0
        };
      }
      acc[builderId].totalPoints += receipt.points;
      return acc;
    },
    {} as Record<string, BuilderAggregateScore>
  );

  const averageGemsPerWeekPerBuilder = Object.values(builderScores).map((builder) => {
    // Find index of first active week in all season weeks
    const firstActiveWeekIndex = allSeasonWeeks.indexOf(builder.firstActiveWeek);

    // Get number of weeks builder has been active (from first week to end of season)
    const activeWeeks = allSeasonWeeks.slice(firstActiveWeekIndex).length;

    // Calculate average based on active weeks instead of full season
    const averageGemsPerWeek = builder.totalPoints / activeWeeks;

    return {
      ...builder,
      averageGemsPerWeek: Math.floor(averageGemsPerWeek)
    };
  });

  const orderedBuilderScores = averageGemsPerWeekPerBuilder.sort((a, b) => b.averageGemsPerWeek - a.averageGemsPerWeek);

  const totalBuilders = orderedBuilderScores.length;

  const buildersWithCentilesAndLevels = orderedBuilderScores.map((builder, index) => {
    // Calculate centile (100 - percentage from top)
    // Using ceiling to ensure top score gets 100 and bottom gets 1
    const centile = Math.ceil(100 - (index / (totalBuilders - 1)) * 99);

    // Calculate level based on centile (10 = 90-100, 9 = 80-89, etc)
    const level = Math.min(10, Math.floor(centile / 10) + 1);

    return {
      ...builder,
      centile,
      level
    };
  });

  return buildersWithCentilesAndLevels;
}
