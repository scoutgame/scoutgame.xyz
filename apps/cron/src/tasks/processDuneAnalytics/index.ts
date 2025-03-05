import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek, getCurrentWeek } from '@packages/dates/utils';
import { getEvmWalletStats, getSolanaWalletStats } from '@packages/dune/queries';
import type Koa from 'koa';
import { taiko } from 'viem/chains';

const log = getLogger('cron-process-dune-analytics');

export async function processDuneAnalytics(ctx: Koa.Context, week = getCurrentWeek()) {
  // look back for the past 7 days
  // TODO: we could be smarter and probably just request the past 2 days or so, since we run at least once per day
  const startOfWeek = getStartOfWeek(week);
  const endOfWeek = startOfWeek.plus({ days: 7 }); // calculate end of week as the start of week + 7 days
  const wallets = await prisma.scoutProjectWallet.findMany({
    where: {
      OR: [
        {
          chainType: 'solana'
        },
        {
          chainId: {
            not: taiko.id
          }
        }
      ]
    }
  });

  log.debug('Found %d wallets to process with Dune Analytics', wallets.length);

  for (const wallet of wallets) {
    try {
      const existingMetrics = await prisma.scoutProjectWalletDailyStats.findMany({
        where: {
          walletId: wallet.id,
          day: {
            gte: startOfWeek.toJSDate(),
            lte: endOfWeek.toJSDate()
          }
        }
      });
      const metrics =
        wallet.chainType === 'solana'
          ? await getSolanaWalletStats({
              address: wallet.address,
              startDate: startOfWeek.toJSDate(),
              endDate: endOfWeek.toJSDate()
            })
          : await getEvmWalletStats({
              address: wallet.address,
              chainId: wallet.chainId!,
              startDate: startOfWeek.toJSDate(),
              endDate: endOfWeek.toJSDate()
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
      log.info(`Created wallet metrics for wallet: ${wallet.address}`, {
        newMetrics: newMetrics.length,
        chainType: wallet.chainType,
        updatedMetrics: updatedMetrics.length,
        walletAddress: wallet.address,
        walletId: wallet.id,
        week
      });
    } catch (error) {
      log.error(`Error creating wallet metrics for wallet: ${wallet.address}`, {
        chainType: wallet.chainType,
        startDate: startOfWeek.toJSDate(),
        endDate: endOfWeek.toJSDate(),
        walletAddress: wallet.address,
        week,
        walletId: wallet.id,
        error
      });
    }
  }
}
