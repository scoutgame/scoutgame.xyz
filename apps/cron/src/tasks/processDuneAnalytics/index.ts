import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { recordContractAnalyticsForWeek } from '@packages/blockchain/analytics/recordContractAnalytics';
import { recordWalletAnalyticsForWeek } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { getCurrentWeek } from '@packages/dates/utils';
import type Koa from 'koa';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

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
            not: {
              in: [taiko.id, taikoTestnetSepolia.id]
            }
          }
        }
      ]
    }
  });

  log.debug('Found %d wallets to process with Dune Analytics', wallets.length);

  for (const wallet of wallets) {
    try {
      const { startDate, endDate, newMetrics, updatedMetrics } = await recordWalletAnalyticsForWeek(wallet, week);
      log.info(`Created wallet metrics for wallet`, {
        newMetrics: newMetrics.length,
        chainType: wallet.chainType,
        updatedMetrics: updatedMetrics.length,
        walletAddress: wallet.address,
        walletId: wallet.id,
        week,
        startDate,
        endDate
      });
    } catch (error) {
      log.error(`Error creating wallet metrics for wallet`, {
        chainType: wallet.chainType,
        address: wallet.address,
        week,
        walletId: wallet.id,
        error
      });
    }
  }
  const contracts = await prisma.scoutProjectContract.findMany({
    where: {
      OR: [
        {
          chainId: {
            not: {
              in: [taiko.id, taikoTestnetSepolia.id]
            }
          }
        }
      ]
    }
  });

  log.debug('Found %d contract to process with Dune Analytics', wallets.length);

  for (const contract of contracts) {
    try {
      const { startDate, endDate, newMetrics, updatedMetrics } = await recordContractAnalyticsForWeek(contract, week);
      log.info(`Created wallet metrics for wallet`, {
        newMetrics: newMetrics.length,
        updatedMetrics: updatedMetrics.length,
        walletId: contract.id,
        week,
        startDate,
        endDate
      });
    } catch (error) {
      log.error(`Error creating contract metrics for contract`, {
        address: contract.address,
        week,
        contractId: contract.id,
        error
      });
    }
  }
}
