import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { isToday } from 'packages/dates/src/utils';
import { getStartOfWeek } from 'packages/dates/src/utils';

async function backfillBuildersCardActivityRanks() {
  const threeWeeksAgoDate = DateTime.now().setZone('UTC').minus({ weeks: 2 }).startOf('week').startOf('day').toJSDate();
  const yesterdayDate = DateTime.now().setZone('UTC').minus({ days: 1 }).endOf('day').toJSDate();

  const gemsReceipts = await prisma.gemsReceipt.findMany({
    where: {
      createdAt: {
        gte: threeWeeksAgoDate,
        lte: yesterdayDate
      },
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
      },
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

  for (const {week ,receipts} of sortedWeeks) {
    const weekStart = getStartOfWeek(week);
    const weeklyBuilderGemsRecord: Record<string, number> = {}

    for (let day = 0; day < 7; day++) {
      const date = weekStart.plus({ days: day });
      const formattedDate = date.toFormat('yyyy-MM-dd');

      if (date > DateTime.now()) {
        continue;
      }

      const todayGemsReceipts = receipts.filter(r => isToday(r.createdAt, date));
      const dailyBuilderGemsRecord: Record<string, number> = {}
      todayGemsReceipts.forEach(receipt => {
        weeklyBuilderGemsRecord[receipt.builderId] = (weeklyBuilderGemsRecord[receipt.builderId] || 0) + receipt.value;
        dailyBuilderGemsRecord[receipt.builderId] = (dailyBuilderGemsRecord[receipt.builderId] || 0) + receipt.value;
      })

      const sortedBuilderGemsRecord = Object.entries(weeklyBuilderGemsRecord).sort((a, b) => b[1] - a[1]);

      sortedBuilderGemsRecord.forEach(([builderId], rank) => {
        builderRanksRecord[builderId] = [...(builderRanksRecord[builderId] || []), {
          date: formattedDate,
          rank: rank + 1,
          gems: dailyBuilderGemsRecord[builderId] || 0
        }];
      })

      const nonContributingBuilders = builders.filter(b => !weeklyBuilderGemsRecord[b.id]);
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
      await prisma.builderCardActivity.update({
        where: {
          builderId: builder.id
        },
        data: {
          last14Days: builderRanks.slice(-14),
        },
      })
    } catch (error) {
      console.error(`Error upserting builder card activity for builder ${builder.id}:`, error);
    }
  }
}

backfillBuildersCardActivityRanks();
