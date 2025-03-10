import { log } from '@charmverse/core/log';
import type { ScoutProjectWallet } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek, getWeekFromDate } from '@packages/dates/utils';
import { getEvmAddressStats, getSolanaWalletStats } from '@packages/dune/queries';
import { DateTime } from 'luxon';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

import { getWalletTransactionStats } from './getTransactionStats';

export function recordWalletAnalyticsForWeek(
  wallet: Pick<ScoutProjectWallet, 'id' | 'address' | 'chainType' | 'chainId'>,
  week: string
) {
  const _startOfWeek = getStartOfWeek(week);
  const startOfWeek = _startOfWeek.toJSDate();
  const endOfWeek = _startOfWeek.plus({ days: 7 }).toJSDate(); // calculate end of week as the start of week + 7 days
  return recordWalletAnalytics(wallet, startOfWeek, endOfWeek);
}

export async function recordWalletAnalytics(
  wallet: Pick<ScoutProjectWallet, 'id' | 'address' | 'chainType' | 'chainId'>,
  startDate: Date,
  endDate: Date,
  now = new Date()
) {
  const existingMetrics = await prisma.scoutProjectWalletDailyStats.findMany({
    where: {
      walletId: wallet.id,
      day: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      day: 'asc'
    }
  });

  // If we there is a recent metric after startOfWeek but from before today, use that date (+1) instead
  if (existingMetrics.length > 0) {
    const today = DateTime.fromJSDate(now, { zone: 'utc' }).startOf('day').toJSDate().getTime();
    const existingMetricsBeforeToday = existingMetrics.filter((m) => m.day.getTime() <= today);
    const latestMetric = existingMetricsBeforeToday[existingMetricsBeforeToday.length - 1];
    if (latestMetric) {
      startDate = DateTime.fromJSDate(latestMetric.day).plus({ days: 1 }).toJSDate();
      log.debug('Found existing metric for wallet %s, using that date instead of startOfWeek', {
        walletAddress: wallet.address,
        lastMetricDate: latestMetric.day,
        newStartDate: startDate
      });
    }
  }

  const metrics =
    wallet.chainType === 'solana'
      ? await getSolanaWalletStats({
          address: wallet.address,
          startDate,
          endDate
        })
      : wallet.chainId === taiko.id || wallet.chainId === taikoTestnetSepolia.id
        ? await getWalletTransactionStats({
            address: wallet.address,
            chainId: wallet.chainId!
          })
        : await getEvmAddressStats({
            address: wallet.address,
            chainId: wallet.chainId!,
            startDate,
            endDate
          });

  // create metrics for missing dates that are within the range
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const day = DateTime.fromJSDate(date).toUTC().startOf('day').toJSDate();
    if (metrics.some((m) => m.day.getTime() === day.getTime())) {
      continue;
    }
    metrics.push({
      day,
      transactions: 0,
      accounts: 0,
      gasFees: '0'
    });
  }
  metrics.sort((a, b) => a.day.getTime() - b.day.getTime());

  // create metrics if they dont exist
  const newMetrics = metrics.filter((m) => !existingMetrics.some((_m) => _m.day.getTime() === m.day.getTime()));

  await prisma.scoutProjectWalletDailyStats.createMany({
    data: newMetrics.map((m) => ({
      ...m,
      walletId: wallet.id,
      week: getWeekFromDate(m.day)
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
  return { newMetrics, updatedMetrics, endDate, startDate };
}
