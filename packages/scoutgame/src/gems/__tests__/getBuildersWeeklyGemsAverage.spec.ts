import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { mockWeek, randomIntFromInterval } from '../../testing/generators';
import { getBuildersWeeklyGemsAverage } from '../getBuildersWeeklyGemsAverage';

beforeAll(async () => {
  await prisma.builderDailyGemsAverage.deleteMany();
});

it('should return the average of the last two weeks of builder daily gems', async () => {
  const today = DateTime.now().setZone('utc').startOf('day');

  let currentDate = today.minus({ day: 1 });
  const averageDailyGems = Array.from({ length: 14 }).map(() => randomIntFromInterval(10, 100));

  for (let i = 0; i < 14; i++) {
    await prisma.builderDailyGemsAverage.create({
      data: {
        date: currentDate.toJSDate(),
        gems: averageDailyGems[i],
        week: mockWeek
      }
    });

    currentDate = currentDate.minus({ day: 1 });
  }

  const totalDailyGems = averageDailyGems.reduce((total, gems) => total + gems, 0);

  const { totalGems, averageGems } = await getBuildersWeeklyGemsAverage();
  expect(totalGems).toBe(totalDailyGems);
  expect(averageGems).toBe(totalDailyGems / 14);
});
