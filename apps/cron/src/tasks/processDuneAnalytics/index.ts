import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { recordWalletAnalytics } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { getCurrentWeek } from '@packages/dates/utils';
import type Koa from 'koa';
import { taiko } from 'viem/chains';

const log = getLogger('cron-process-dune-analytics');

export async function processDuneAnalytics(ctx: Koa.Context, week = getCurrentWeek()) {
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
      const { startOfWeek, endOfWeek, newMetrics, updatedMetrics } = await recordWalletAnalytics(wallet, week);
      log.info(`Created wallet metrics for wallet: ${wallet.address}`, {
        newMetrics: newMetrics.length,
        chainType: wallet.chainType,
        updatedMetrics: updatedMetrics.length,
        walletAddress: wallet.address,
        walletId: wallet.id,
        week,
        startOfWeek,
        endOfWeek
      });
    } catch (error) {
      log.error(`Error creating wallet metrics for wallet: ${wallet.address}`, {
        chainType: wallet.chainType,
        walletAddress: wallet.address,
        week,
        walletId: wallet.id,
        error
      });
    }
  }
}
