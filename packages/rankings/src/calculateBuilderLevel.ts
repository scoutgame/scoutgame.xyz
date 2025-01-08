import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getAllISOWeeksFromSeasonStart, getCurrentSeasonStart, getWeekFromDate } from '@packages/dates/utils';

type BuilderAggregateScore = {
  builderId: string;
  totalGems: number;
  firstActiveWeek: ISOWeek;
};

export async function calculateBuilderLevels({ season = getCurrentSeasonStart() }: { season?: ISOWeek }) {
  const allSeasonWeeks = getAllISOWeeksFromSeasonStart({ season });

  // Fetch all builders with their GemReceipts
  const gemReceipts = await prisma.gemsReceipt.findMany({
    where: {
      event: {
        season,
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
      value: true,
      event: {
        select: {
          builderId: true
        }
      }
    }
  });

  const builderScores = gemReceipts.reduce(
    (acc, receipt) => {
      const builderId = receipt.event.builderId;

      if (!acc[builderId]) {
        acc[builderId] = {
          builderId,
          totalGems: 0,
          firstActiveWeek: getWeekFromDate(receipt.createdAt)
        };
      }

      acc[builderId].totalGems += receipt.value;
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
    const averageGemsPerWeek = builder.totalGems / activeWeeks;

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

// Example usage
// rankBuilders()
//   .then((result) => {
//     console.log('Ranked builders:', result);
//   })
//   .catch((error) => {
//     console.error('Error ranking builders:', error);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
