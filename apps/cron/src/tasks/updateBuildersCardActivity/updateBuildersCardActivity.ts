import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import { getBuildersLeaderboard } from '@packages/scoutgame/builders/getBuildersLeaderboard';
import { normalizeLast14DaysRank } from '@packages/scoutgame/builders/utils/normalizeLast14DaysRank';
import { DateTime } from 'luxon';

export async function updateBuildersCardActivity(date: DateTime) {
  const weekDay = date.weekday;
  const builderCardActivities = await prisma.builderCardActivity.findMany({
    select: {
      builderId: true,
      last7Days: true
    }
  });
  const builderCardActivitiesRecord: Record<string, { last14Days: number[]; builderId: string }> = {};
  const yesterdayDate = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd');

  for (const builderCardActivity of builderCardActivities) {
    builderCardActivitiesRecord[builderCardActivity.builderId] = {
      last14Days: normalizeLast14DaysRank(builderCardActivity),
      builderId: builderCardActivity.builderId
    };
  }

  const lastWeek = getLastWeek();
  const buildersLeaderboard = await getBuildersLeaderboard({
    // If monday get the last week's leaderboard since it contains sunday's data
    week: weekDay === 1 ? lastWeek : getCurrentWeek()
  });

  for (const { builder, rank } of buildersLeaderboard) {
    try {
      await prisma.builderCardActivity.upsert({
        where: { builderId: builder.id },
        update: {
          last7Days: [
            ...builderCardActivitiesRecord[builder.id].last14Days,
            {
              date: yesterdayDate,
              rank
            }
          ].slice(-14)
        },
        create: {
          builderId: builder.id,
          last7Days: [
            {
              date: yesterdayDate,
              rank
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
