import { log } from '@charmverse/core/log';
import type { ScoutProjectContract } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek, getWeekFromDate } from '@packages/dates/utils';
import { getEvmAddressStats } from '@packages/dune/queries';
import { partition } from '@packages/utils/array';
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
  endDate: Date,
  now = new Date()
) {
  const dailyStatsInDb = await prisma.scoutProjectContractDailyStats.findMany({
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
  if (dailyStatsInDb.length > 0) {
    const today = DateTime.fromJSDate(now, { zone: 'utc' }).startOf('day').toJSDate().getTime();
    const dailyStatsBeforeToday = dailyStatsInDb.filter((m) => m.day.getTime() < today);
    const latestStat = dailyStatsBeforeToday[dailyStatsBeforeToday.length - 1];
    if (latestStat) {
      startDate = DateTime.fromJSDate(latestStat.day).plus({ days: 1 }).toJSDate();
      log.debug('Found existing daily stat for contract %s, using that date instead of startOfWeek', {
        contract: wallet.address,
        lastMetricDate: latestStat.day,
        newStartDate: startDate
      });
    }
  }

  // Get latest daily stats from the blockchain. TODO: Support Solana
  const dailyStats =
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

  // create metrics for missing dates that are within the window
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const day = DateTime.fromJSDate(date).toUTC().startOf('day').toJSDate();
    if (dailyStats.some((s) => s.day.getTime() === day.getTime())) {
      continue;
    }
    dailyStats.push({
      day,
      transactions: 0,
      accounts: 0,
      gasFees: '0'
    });
  }
  dailyStats.sort((a, b) => a.day.getTime() - b.day.getTime());

  // split metrics into new and existing
  const [dailyStatsToUpdate, newDailyStats] = partition(dailyStats, (dailyStat) =>
    dailyStatsInDb.some((_m) => _m.day.getTime() === dailyStat.day.getTime())
  );

  // create metrics that do not exist
  if (newDailyStats.length > 0) {
    await prisma.scoutProjectContractDailyStats.createMany({
      data: newDailyStats.map((s) => ({
        ...s,
        contractId: wallet.id,
        week: getWeekFromDate(s.day)
      }))
    });
  }

  // update existing metrics
  for (const dailyStat of dailyStatsToUpdate) {
    await prisma.scoutProjectContractDailyStats.update({
      where: {
        contractId_day: {
          contractId: wallet.id,
          day: dailyStat.day
        }
      },
      data: dailyStat
    });
  }
  return { newDailyStats, updatedDailyStats: dailyStatsToUpdate, endDate, startDate };
}
