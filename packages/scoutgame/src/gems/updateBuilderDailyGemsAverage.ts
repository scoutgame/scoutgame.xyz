import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';

// Update the average daily gems earned by builders for the previous day
export async function updateBuilderDailyGemsAverage(now = DateTime.now()) {
  const date = now.setZone('utc').minus({ day: 1 });
  const startDate = date.startOf('day').toJSDate();
  const endDate = date.endOf('day').toJSDate();

  const currentWeek = getCurrentWeek();

  const builders = await prisma.scout.findMany({
    where: {
      deletedAt: null,
      builderStatus: 'approved',
      events: {
        some: {
          type: {
            in: ['daily_commit', 'merged_pull_request']
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          gemsReceipt: {
            isNot: null
          }
        }
      }
    },
    select: {
      events: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          gemsReceipt: {
            isNot: null
          }
        },
        select: {
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      }
    }
  });

  const totalBuilders = builders.length;
  const totalGems = builders
    .flatMap((builder) => builder.events)
    .reduce((gems, event) => {
      return gems + (event.gemsReceipt?.value ?? 0);
    }, 0);

  const averageGems = totalBuilders > 0 ? totalGems / totalBuilders : 0;

  await prisma.builderDailyGemsAverage.upsert({
    where: {
      date: startDate
    },
    update: {
      gems: averageGems
    },
    create: {
      date: startDate,
      week: currentWeek,
      gems: averageGems
    }
  });

  log.info(`Updated builder daily gems average`, {
    date: startDate,
    totalBuilders,
    totalGems,
    averageGems
  });

  return {
    totalBuilders,
    totalGems,
    averageGems
  };
}
