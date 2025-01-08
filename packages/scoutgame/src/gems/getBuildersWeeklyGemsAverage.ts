import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

export async function getBuildersWeeklyGemsAverage(now = DateTime.now()) {
  const today = now.setZone('utc').startOf('day');
  const yesterday = today.minus({ day: 1 }).endOf('day');
  const twoWeeksAgo = yesterday.minus({ weeks: 2 });

  const builderDailyGemsAverages = await prisma.builderDailyGemsAverage.findMany({
    where: {
      date: {
        gte: twoWeeksAgo.toJSDate(),
        lte: yesterday.toJSDate()
      }
    },
    select: {
      gems: true
    }
  });

  const totalGems = builderDailyGemsAverages.reduce((total, { gems }) => total + gems, 0);

  return {
    totalGems,
    averageGems: totalGems / builderDailyGemsAverages.length
  };
}
