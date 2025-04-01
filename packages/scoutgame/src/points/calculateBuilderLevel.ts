import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

export type BuilderAggregateScore = {
  builderId: string;
  totalPoints: number;
  firstActiveWeek: ISOWeek;
  activeWeeks: number;
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
  season = getCurrentSeasonStart(),
  week
}: {
  season?: ISOWeek;
  week?: ISOWeek;
} = {}): Promise<BuilderAggregateScore[]> {
  let weeksWindow = getAllISOWeeksFromSeasonStart({ season });

  // for looking at historical data, where the current week has been completed
  if (week) {
    weeksWindow = weeksWindow.filter((_week) => _week <= week);
  }

  // Filter out current week if season is the current season. We only want the historical data
  if (season === getCurrentSeasonStart()) {
    const currentWeek = getCurrentWeek();
    weeksWindow = weeksWindow.filter((_week) => _week < currentWeek);
  }

  // Fetch all builders with their gem payouts
  const gemPayouts = await prisma.gemsPayoutEvent.findMany({
    where: {
      points: {
        gt: 0
      },
      builderEvent: {
        season,
        week: week
          ? {
              lte: week
            }
          : undefined,
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
    (acc, gemsPayout) => {
      const builderId = gemsPayout.builderId;

      // Ignore empty gem payouts
      if (!gemsPayout.points) {
        return acc;
      }

      if (!acc[builderId]) {
        // Find index of first active week in all season weeks
        const firstActiveWeekIndex = weeksWindow.indexOf(gemsPayout.week);

        // Get number of weeks builder has been active (from first week to end of season)
        const activeWeeks = weeksWindow.slice(firstActiveWeekIndex).length;
        acc[builderId] = {
          builderId,
          totalPoints: 0,
          firstActiveWeek: gemsPayout.week,
          activeWeeks,
          centile: 0,
          level: 0,
          averageGemsPerWeek: 0
        };
      }

      acc[builderId].totalPoints += gemsPayout.points;
      acc[builderId].averageGemsPerWeek = Math.floor(acc[builderId].totalPoints / acc[builderId].activeWeeks);
      return acc;
    },
    {} as Record<string, BuilderAggregateScore>
  );

  const orderedBuilderScores = Object.values(builderScores).sort((a, b) => b.averageGemsPerWeek - a.averageGemsPerWeek);

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
