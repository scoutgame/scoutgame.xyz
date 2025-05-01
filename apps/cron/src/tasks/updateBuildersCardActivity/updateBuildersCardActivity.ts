import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import { getDevelopersLeaderboard } from '@packages/scoutgame/builders/getDevelopersLeaderboard';
import type { Last14DaysRank } from '@packages/scoutgame/builders/interfaces';
import { DateTime } from 'luxon';

export async function updateBuildersCardActivity(date: DateTime) {
  const weekDay = date.weekday;
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      builderCardActivities: true,
      id: true
    }
  });
  const yesterdayDate = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd');
  const lastWeek = getLastWeek(date);
  const buildersLeaderboard = await getDevelopersLeaderboard({
    // If monday get the last week's leaderboard since it contains sunday's data
    week: weekDay === 1 ? lastWeek : getCurrentWeek()
  });

  const buildersLeaderboardRecord: Record<string, { rank: number | null }> = {};
  for (const { builder, rank } of buildersLeaderboard) {
    buildersLeaderboardRecord[builder.id] = { rank };
  }

  const buildersRanksRecord: Record<string, (number | null)[]> = {};

  for (const builder of builders) {
    try {
      const rank = buildersLeaderboardRecord[builder.id]?.rank ?? null;
      const updatedBuilderCardActivity = await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: {
          last14Days: [
            ...((builder.builderCardActivities[0]?.last14Days as Last14DaysRank) ?? []),
            {
              date: yesterdayDate,
              rank
            }
          ].slice(-14)
        },
        create: {
          builderId: builder.id,
          last14Days: [
            {
              date: yesterdayDate,
              rank
            }
          ]
        }
      });

      buildersRanksRecord[builder.id] = (updatedBuilderCardActivity.last14Days as Last14DaysRank).map(
        ({ rank: _rank }) => _rank
      );
    } catch (error) {
      log.error(`Error updating dev card activity for builder`, {
        builderId: builder.id,
        date,
        error
      });
    }
  }

  return buildersRanksRecord;
}
