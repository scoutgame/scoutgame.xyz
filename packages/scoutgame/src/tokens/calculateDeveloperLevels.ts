import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

export type DeveloperAggregateScore = {
  developerId: string;
  totalTokens: bigint;
  firstActiveWeek: ISOWeek;
  activeWeeks: number;
  level: number;
  centile: number;
  averageTokensPerWeek: bigint;
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

// To determine the level of a developer, we look at their average tokens earned per week over the course of the season
export async function calculateDeveloperLevels({
  season = getCurrentSeasonStart(),
  week
}: {
  season?: ISOWeek;
  week?: ISOWeek;
} = {}): Promise<DeveloperAggregateScore[]> {
  // Fetch all developers with their gem payouts
  const payoutEvents = await prisma.builderEvent.findMany({
    where: {
      type: 'gems_payout',
      season,
      week: week
        ? {
            lte: week
          }
        : undefined,
      builder: {
        builderNfts: {
          some: {
            season
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      createdAt: true,
      week: true,
      builderId: true,
      tokensReceipts: {
        select: {
          value: true
        }
      },
      builder: {
        select: {
          path: true
        }
      }
    }
  });

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

  const developerScores = payoutEvents.reduce(
    (acc, event) => {
      const developerId = event.builderId;

      // Ignore empty gem payouts
      if (event.tokensReceipts.length === 0) {
        return acc;
      }

      if (!acc[developerId]) {
        // Find index of first active week in all season weeks
        const firstActiveWeekIndex = weeksWindow.indexOf(event.week);

        // Get number of weeks builder has been active (from first week to end of season)
        const activeWeeks = weeksWindow.slice(firstActiveWeekIndex).length;
        acc[developerId] = {
          developerId,
          totalTokens: BigInt(0),
          firstActiveWeek: event.week,
          activeWeeks,
          centile: 0,
          level: 0,
          averageTokensPerWeek: BigInt(0)
        };
      }

      const tokensEarned = event.tokensReceipts.reduce((sum, receipt) => {
        return sum + BigInt(receipt.value);
      }, BigInt(0));

      const total = acc[developerId].totalTokens;

      acc[developerId].totalTokens += tokensEarned;
      acc[developerId].averageTokensPerWeek = acc[developerId].totalTokens / BigInt(acc[developerId].activeWeeks);
      return acc;
    },
    {} as Record<string, DeveloperAggregateScore>
  );

  const orderedDeveloperScores = Object.values(developerScores).sort((a, b) =>
    Number(b.averageTokensPerWeek - a.averageTokensPerWeek)
  );

  const totalDevelopers = orderedDeveloperScores.length;

  const developersWithCentilesAndLevels = orderedDeveloperScores.map((developer, index) => {
    // Calculate centile (100 - percentage from top)
    // Using ceiling to ensure top score gets 100 and bottom gets 1
    const centile = Math.ceil(100 - (index / (totalDevelopers - 1)) * 99);

    // Calculate level based on centile (10 = 90-100, 9 = 80-89, etc)
    const level = Math.min(10, Math.floor(centile / 10) + 1);

    return {
      ...developer,
      centile,
      level
    };
  });

  return developersWithCentilesAndLevels;
}
