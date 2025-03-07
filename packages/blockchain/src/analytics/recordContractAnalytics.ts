import { log } from '@charmverse/core/log';
import type { ScoutProjectContract } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek, getWeekFromDate } from '@packages/dates/utils';
import { getEvmAddressStats } from '@packages/dune/queries';
import { DateTime } from 'luxon';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

import { getContractTransactionStats } from './getTransactionStats';

export function recordContractAnalyticsForWeek(
  contract: Pick<ScoutProjectContract, 'id' | 'address' | 'chainId'>,
  week: string
) {
  const _startOfWeek = getStartOfWeek(week);
  const startOfWeek = _startOfWeek.toJSDate();
  const endOfWeek = _startOfWeek.plus({ days: 7 }).toJSDate(); // calculate end of week as the start of week + 7 days
  return recordContractAnalytics(contract, startOfWeek, endOfWeek);
}

export async function recordContractAnalytics(
  wallet: Pick<ScoutProjectContract, 'id' | 'address' | 'chainId'>,
  startDate: Date,
  endDate: Date
) {
  const existingMetrics = await prisma.scoutProjectContractDailyStats.findMany({
    where: {
      contractId: wallet.id,
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
    const today = DateTime.utc().startOf('day').toJSDate().getTime();
    const existingMetricsBeforeToday = existingMetrics.filter((m) => m.day.getTime() < today);
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

  // TODO: Support Solana
  const metrics =
    wallet.chainId === taiko.id || wallet.chainId === taikoTestnetSepolia.id
      ? await getContractTransactionStats({
          address: wallet.address,
          chainId: wallet.chainId!
        })
      : await getEvmAddressStats({
          address: wallet.address,
          chainId: wallet.chainId!,
          startDate,
          endDate
        });

  // create metrics if they dont exist
  const newMetrics = metrics.filter((m) => !existingMetrics.some((_m) => _m.day.getTime() === m.day.getTime()));
  await prisma.scoutProjectContractDailyStats.createMany({
    data: newMetrics.map((m) => ({
      ...m,
      contractId: wallet.id,
      week: getWeekFromDate(m.day)
    }))
  });
  // update metrics if they exist
  const updatedMetrics = metrics.filter((m) => existingMetrics.some((_m) => _m.day.getTime() === m.day.getTime()));
  for (const metric of updatedMetrics) {
    await prisma.scoutProjectContractDailyStats.update({
      where: {
        contractId_day: {
          contractId: wallet.id,
          day: metric.day
        }
      },
      data: metric
    });
  }
  return { newMetrics, updatedMetrics, endDate, startDate };
}
