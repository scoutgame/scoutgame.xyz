import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { isToday } from 'packages/dates/src/utils';
import { getStartOfWeek } from 'packages/dates/src/utils';

async function backfillBuildersCardActivityRanks() {
  const threeWeeksAgoDate = DateTime.now().minus({ weeks: 2 }).startOf('week').startOf('day').toJSDate();
  const yesterdayDate = DateTime.now().minus({ days: 1 }).endOf('day').toJSDate();

  const gemsReceipts = await prisma.gemsReceipt.findMany({
    where: {
      createdAt: {
        gte: threeWeeksAgoDate,
        lte: yesterdayDate
      }
    },
    select: {
      value: true,
      createdAt: true,
      event: {
        select: {
          week: true,
          builderId: true
        }
      }
    }
  })

  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        in: ['approved', 'banned']
      }
    },
    select: {
      id: true
    }
  })

  const weeklyGemsReceiptsRecord: Record<string, {
    week: string,
    receipts: {
      value: number,
      builderId: string
      createdAt: Date
    }[]
  }> = {}

  for (const gemsReceipt of gemsReceipts) {
    const week = gemsReceipt.event.week;
    const builderId = gemsReceipt.event.builderId;
    const value = gemsReceipt.value;

    if (!weeklyGemsReceiptsRecord[week]) {
      weeklyGemsReceiptsRecord[week] = {
        week,
        receipts: []
      }
    }

    weeklyGemsReceiptsRecord[week].receipts.push({
      value,
      builderId,
      createdAt: gemsReceipt.createdAt
    })
  }

  const sortedWeeks = Object.values(weeklyGemsReceiptsRecord).sort((a, b) => a.week > b.week ? 1 : -1);

  const builderRanksRecord: Record<string, {
    date: string,
    rank: number | null,
    gems: number
  }[]> = {}

  const leaderboards: {
    date: string,
    builders: {
      builderId: string
      gems: number
      rank: number
    }[]
  }[] = []

  for (const {week ,receipts} of sortedWeeks) {
    const weekStart = getStartOfWeek(week);

    for (let day = 0; day < 7; day++) {
      const date = weekStart.plus({ days: day });
      const formattedDate = date.toFormat('yyyy-MM-dd');

      if (date > DateTime.now()) {
        continue;
      }

      const todayGemsReceipts = receipts.filter(r => isToday(r.createdAt, date));
      const builderDailyGemsRecord = todayGemsReceipts.reduce<Record<string, number>>((acc, r) => {
        acc[r.builderId] = (acc[r.builderId] || 0) + r.value;
        return acc;
      }, {});

      const builderGemsRecord: Record<string, number> = JSON.parse(JSON.stringify(builderDailyGemsRecord));

      if (day !== 0) {
        const currentDay = leaderboards.length;
        const previousDayLeaderboard = leaderboards[currentDay - 1];
        previousDayLeaderboard.builders.forEach(builder => {
          if (builderGemsRecord[builder.builderId]) {
            builderGemsRecord[builder.builderId] += builder.gems;
          } else {
            builderGemsRecord[builder.builderId] = builder.gems;
          }
        })
      }

      const leaderboard = Object.entries(builderGemsRecord).sort((a, b) => b[1] - a[1]);
      leaderboard.forEach(([builderId], rank) => {
        builderRanksRecord[builderId] = [...(builderRanksRecord[builderId] || []), {
          date: formattedDate,
          rank: rank + 1,
          gems: builderDailyGemsRecord[builderId]
        }];
      })

      leaderboards.push({
        date: formattedDate,
        builders: leaderboard.map(([builderId], rank) => ({
          builderId,
          rank: rank + 1,
          gems: builderDailyGemsRecord[builderId]
        }))
      })

      const nonContributingBuilders = builders.filter(b => !builderGemsRecord[b.id]);
      nonContributingBuilders.forEach(builder => {
        builderRanksRecord[builder.id] = [...(builderRanksRecord[builder.id] || []), {
          date: formattedDate,
          rank: null,
          gems: 0
        }];
      })
    }
  }

  for (const builder of builders) {
    const builderRanks = builderRanksRecord[builder.id];
    try {
      await prisma.builderCardActivity.upsert({
        where: {
          builderId: builder.id
        },
        update: {
          last14Days: builderRanks.slice(-14),
        },
        create: {
          builderId: builder.id,
          last14Days: builderRanks.slice(-14),
        }
      })
    } catch (error) {
      console.error(`Error upserting builder card activity for builder ${builder.id}:`, error);
    }
  }
}

backfillBuildersCardActivityRanks();
