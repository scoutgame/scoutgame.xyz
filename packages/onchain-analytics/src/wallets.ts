import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getStartOfWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { taiko } from 'viem/chains';

import { getEvmWalletStats, getSolanaWalletStats } from './dune';

const log = getLogger('onchain-analytics-wallets');

export async function processWallets({ week }: { week: string }) {
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
  log.debug('Found %d wallets to process', wallets.length);
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
