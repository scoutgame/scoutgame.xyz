import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { getCurrentWeek, getPreviousWeek, isToday } from '@packages/dates/utils';
import { getStartOfWeek } from '@packages/dates/utils';

async function backfillBuildersCardActivityRanks() {
  const threeWeeksAgoDate = DateTime.now().setZone('UTC').minus({ weeks: 2 }).startOf('week').startOf('day').toJSDate();
  const yesterdayDate = DateTime.now().setZone('UTC').minus({ days: 1 }).endOf('day').toJSDate();
  const todayDateFormatted = DateTime.now().setZone('UTC').startOf('day').toFormat('yyyy-MM-dd');

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
          builderId: true,
          builder: {
            select: {
              displayName: true
            }
          }
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
    value: number,
    builderId: string,
    createdAt: Date,
    displayName: string
  }[]> = {}

  for (const gemsReceipt of gemsReceipts) {
    const week = gemsReceipt.event.week;
    const builderId = gemsReceipt.event.builderId;
    const value = gemsReceipt.value;

    if (!weeklyGemsReceiptsRecord[week]) {
      weeklyGemsReceiptsRecord[week] = []
    }

    weeklyGemsReceiptsRecord[week].push({
      value,
      builderId,
      createdAt: gemsReceipt.createdAt,
      displayName: gemsReceipt.event.builder.displayName
    })
  }

  const currentWeek = getCurrentWeek();
  const previousWeek = getPreviousWeek(currentWeek);
  const previousPreviousWeek = getPreviousWeek(previousWeek);

  const sortedWeekReceipts = [
    {
      week: previousPreviousWeek,
      receipts: weeklyGemsReceiptsRecord[previousPreviousWeek]
    },
    {
      week: previousWeek,
      receipts: weeklyGemsReceiptsRecord[previousWeek]
    },
    {
      week: currentWeek,
      receipts: weeklyGemsReceiptsRecord[currentWeek]
    }
  ];

  const builderRanksRecord: Record<string, {
    date: string,
    rank: number | null,
    gems: number
  }[]> = {}

  for (const {week, receipts = []} of sortedWeekReceipts) {
    const weekStart = getStartOfWeek(week);
    const weeklyBuilderGemsRecord: Record<string, {
      gemsCollected: number,
      earliestEventDate: Date,
      displayName: string
    }> = {}

    for (let day = 0; day < 7; day++) {
      const date = weekStart.setZone('UTC').plus({ days: day }).startOf('day');
      const formattedDate = date.toFormat('yyyy-MM-dd');
      
      if (formattedDate === todayDateFormatted) {
        break
      }

      const todayGemsReceipts = receipts.filter(r => isToday(r.createdAt, date));
      const dailyBuilderGemsRecord: Record<string, number> = {}
      todayGemsReceipts.forEach(receipt => {
        if (!weeklyBuilderGemsRecord[receipt.builderId]) {
          weeklyBuilderGemsRecord[receipt.builderId] = {
            gemsCollected: 0,
            earliestEventDate: receipt.createdAt,
            displayName: receipt.displayName
          }
        }
        weeklyBuilderGemsRecord[receipt.builderId].gemsCollected += receipt.value;
        if (weeklyBuilderGemsRecord[receipt.builderId].earliestEventDate > receipt.createdAt) {
          weeklyBuilderGemsRecord[receipt.builderId].earliestEventDate = receipt.createdAt;
        }
        dailyBuilderGemsRecord[receipt.builderId] = (dailyBuilderGemsRecord[receipt.builderId] || 0) + receipt.value;
      })

      const sortedBuilderGemsRecord = Object.entries(weeklyBuilderGemsRecord).sort((a, b) => {
        if (a[1].gemsCollected === b[1].gemsCollected) {
          const eventA = a[1].earliestEventDate.getTime();
          const eventB = b[1].earliestEventDate.getTime();
          if (eventA === eventB) {
            return a[1].displayName.localeCompare(b[1].displayName);
          }
          return eventA - eventB;
        }
        return b[1].gemsCollected - a[1].gemsCollected;
      });

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
        },
      })
      console.log(`Upserted builder card activity for builder ${builder.id}`);
    } catch (error) {
      console.error(`Error upserting builder card activity for builder ${builder.id}:`, error);
    }
  }
}

backfillBuildersCardActivityRanks();
