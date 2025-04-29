import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { normalizeLast14DaysRank } from '@packages/scoutgame/builders/utils/normalizeLast14DaysRank';
import { mockBuilder } from '@packages/testing/database';
import { DateTime } from 'luxon';

import { updateBuildersCardActivity } from '../updateBuildersCardActivity';

beforeEach(async () => {
  await prisma.userWeeklyStats.deleteMany();
  await prisma.builderCardActivity.deleteMany();
});

describe('updateBuildersCardActivity', () => {
  it('should update the builders card activity when its monday', async () => {
    // Monday 12am
    const currentWeekMonday = DateTime.now().startOf('week');
    const lastWeekSundayDate = currentWeekMonday.minus({ days: 1 }).toFormat('yyyy-MM-dd');
    const lastWeek = getLastWeek();
    const builders = await Promise.all(Array.from({ length: 3 }, () => mockBuilder()));

    // Create activity for dev 1 for last week to check if it stays the same
    await prisma.builderCardActivity.create({
      data: {
        last14Days: [
          {
            date: lastWeekSundayDate,
            rank: 1
          }
        ],
        builderId: builders[0].id
      }
    });

    await prisma.userWeeklyStats.create({
      data: {
        week: lastWeek,
        gemsCollected: 10,
        userId: builders[0].id,
        season: getCurrentSeasonStart(lastWeek)
      }
    });

    await prisma.userWeeklyStats.create({
      data: {
        week: lastWeek,
        gemsCollected: 30,
        userId: builders[1].id,
        season: getCurrentSeasonStart(lastWeek)
      }
    });

    await updateBuildersCardActivity(currentWeekMonday);

    const builderCardActivities = await prisma.builderCardActivity.findMany();
    const builder1CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[0].id);
    const builder2CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[1].id);
    const builder3CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[2].id);

    expect(builder1CardActivity).toBeDefined();
    expect(builder2CardActivity).toBeDefined();
    expect(builder3CardActivity).toBeDefined();

    // Builder 1 should have a rank of 2 since they earned 10 gems last week
    expect(normalizeLast14DaysRank(builder1CardActivity!)).toStrictEqual([1, 2]);
    // Builder 2 should have a rank of 1 since they earned 30 gems last week
    expect(normalizeLast14DaysRank(builder2CardActivity!)).toStrictEqual([1]);
    // Builder 3 should have a rank of null since they earned 0 gems past week
    expect(normalizeLast14DaysRank(builder3CardActivity!)).toStrictEqual([null]);
  });

  it('should update the builders card activity when its not monday', async () => {
    const currentWeekMonday = DateTime.now().startOf('week');
    const lastWeekSundayDate = currentWeekMonday.minus({ days: 1 }).toFormat('yyyy-MM-dd');
    const lastWeek = getLastWeek();
    const builders = await Promise.all(Array.from({ length: 3 }, () => mockBuilder()));

    await prisma.builderCardActivity.create({
      data: {
        last14Days: [
          {
            date: lastWeekSundayDate,
            rank: 1
          }
        ],
        builderId: builders[0].id
      }
    });

    await prisma.userWeeklyStats.create({
      data: {
        week: lastWeek,
        gemsCollected: 10,
        userId: builders[0].id,
        season: getCurrentSeasonStart(lastWeek)
      }
    });

    await prisma.userWeeklyStats.create({
      data: {
        week: lastWeek,
        gemsCollected: 30,
        userId: builders[1].id,
        season: getCurrentSeasonStart(lastWeek)
      }
    });

    await updateBuildersCardActivity(currentWeekMonday);

    const builderCardActivities = await prisma.builderCardActivity.findMany();
    const builder1CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[0].id);
    const builder2CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[1].id);
    const builder3CardActivity = builderCardActivities.find((activity) => activity.builderId === builders[2].id);

    expect(builder1CardActivity).toBeDefined();
    expect(builder2CardActivity).toBeDefined();
    expect(builder3CardActivity).toBeDefined();

    // Builder 1 should have a rank of 2 since they earned 10 gems this week
    expect(normalizeLast14DaysRank(builder1CardActivity!)).toStrictEqual([1, 2]);
    // Builder 2 should have a rank of 1 since they earned 30 gems this week
    expect(normalizeLast14DaysRank(builder2CardActivity!)).toStrictEqual([1]);
    // Builder 3 should have a rank of null since they earned 0 gems this week
    expect(normalizeLast14DaysRank(builder3CardActivity!)).toStrictEqual([null]);
  });
});
