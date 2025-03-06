import { log } from '@charmverse/core/log';
import type { ScoutProjectWallet } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek } from '@packages/dates/utils';
import { getEvmWalletStats, getSolanaWalletStats } from '@packages/dune/queries';
import { DateTime } from 'luxon';

export async function recordWalletAnalytics(
  wallet: Pick<ScoutProjectWallet, 'id' | 'address' | 'chainType' | 'chainId'>,
  week: string
) {
  const _startOfWeek = getStartOfWeek(week);
  const startOfWeek = _startOfWeek.toJSDate();
  const endOfWeek = _startOfWeek.plus({ days: 7 }).toJSDate(); // calculate end of week as the start of week + 7 days
  const existingMetrics = await prisma.scoutProjectWalletDailyStats.findMany({
    where: {
      walletId: wallet.id,
      day: {
        gte: startOfWeek,
        lte: endOfWeek
      }
    },
    orderBy: {
      day: 'asc'
    }
  });

  let startDate = startOfWeek;

  // If we there is a recent metric after startOfWeek but from before today, use that date (+1) instead
  if (existingMetrics.length > 0) {
    const today = DateTime.utc().startOf('day').toJSDate().getTime();
    const existingMetricsBeforeToday = existingMetrics.filter((m) => m.day.getTime() < today);
    const latestMetric = existingMetricsBeforeToday[existingMetricsBeforeToday.length - 1];
    if (latestMetric) {
      startDate = DateTime.fromJSDate(latestMetric.day).plus({ days: 1 }).toJSDate();
      log.debug('Found existing metric for wallet %s, using that date instead of startOfWeek', {
        walletAddress: wallet.address,
        lastMetricDate: latestMetric.day,
        startOfWeek,
        newStartDate: startDate
      });
    }
  }

  const metrics =
    wallet.chainType === 'solana'
      ? await getSolanaWalletStats({
          address: wallet.address,
          startDate,
          endDate: endOfWeek
        })
      : await getEvmWalletStats({
          address: wallet.address,
          chainId: wallet.chainId!,
          startDate: startOfWeek,
          endDate: endOfWeek
        });
  // create metrics if they dont exist
  const newMetrics = metrics.filter((m) => !existingMetrics.some((_m) => _m.day.getTime() === m.day.getTime()));
  await prisma.scoutProjectWalletDailyStats.createMany({
    data: newMetrics.map((m) => ({
      ...m,
      walletId: wallet.id
    }))
  });
  // update metrics if they exist
  const updatedMetrics = metrics.filter((m) => existingMetrics.some((_m) => _m.day.getTime() === m.day.getTime()));
  for (const metric of updatedMetrics) {
    await prisma.scoutProjectWalletDailyStats.update({
      where: {
        walletId_day: {
          walletId: wallet.id,
          day: metric.day
        }
      },
      data: metric
    });
  }
  return { newMetrics, updatedMetrics, startOfWeek, endOfWeek };
}
