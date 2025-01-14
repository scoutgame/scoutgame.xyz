import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import { getBuildersLeaderboard } from '@packages/scoutgame/builders/getBuildersLeaderboard';
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
  const lastWeek = getLastWeek();
  const buildersLeaderboard = await getBuildersLeaderboard({
    // If monday get the last week's leaderboard since it contains sunday's data
    week: weekDay === 1 ? lastWeek : getCurrentWeek()
  });

  const buildersLeaderboardRecord: Record<string, { rank: number | null; gemsCollected: number }> = {};
  for (const { builder, rank, gemsCollected } of buildersLeaderboard) {
    buildersLeaderboardRecord[builder.id] = { rank, gemsCollected };
  }

  for (const builder of builders) {
    try {
      const builderLeaderboard = buildersLeaderboardRecord[builder.id];
      const rank = builderLeaderboard?.rank ?? null;
      await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: {
          last14Days: [
            ...((builder.builderCardActivities[0]?.last14Days as Last14DaysRank) ?? []),
            {
              date: yesterdayDate,
              rank,
              gems: builderLeaderboard.gemsCollected || 0
            }
          ].slice(-14)
        },
        create: {
          builderId: builder.id,
          last14Days: [
            {
              date: yesterdayDate,
              rank,
              gems: builderLeaderboard.gemsCollected || 0
            }
          ]
        }
      });
    } catch (error) {
      log.error(`Error updating builder card activity for builder`, {
        builderId: builder.id,
        date,
        error
      });
    }
  }
}
