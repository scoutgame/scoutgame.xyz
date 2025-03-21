import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getNewProjectAchievements } from '@packages/blockchain/analytics/getNewProjectAchievements';
import { recordContractAnalyticsForWeek } from '@packages/blockchain/analytics/recordContractAnalytics';
import { recordWalletAnalyticsForWeek } from '@packages/blockchain/analytics/recordWalletAnalytics';
import { saveProjectAchievement } from '@packages/blockchain/analytics/saveProjectAchievement';
import { getCurrentWeek } from '@packages/dates/utils';
import type Koa from 'koa';
import { taiko, taikoTestnetSepolia } from 'viem/chains';

const log = getLogger('cron-process-dune-analytics');

export async function processDuneAnalytics(ctx: Koa.Context, week = getCurrentWeek()) {
  // const wallets = await prisma.scoutProjectWallet.findMany({
  //   where: {
  //     OR: [
  //       {
  //         chainType: 'solana',
  //         deletedAt: null
  //       },
  //       {
  //         chainId: {
  //           not: {
  //             in: [taiko.id, taikoTestnetSepolia.id]
  //           }
  //         },
  //         deletedAt: null
  //       }
  //     ]
  //   },
  //   select: {
  //     id: true,
  //     address: true,
  //     chainId: true,
  //     chainType: true
  //   }
  // });

  // log.debug(`Found ${wallets.length} wallets to process with Dune Analytics`);

  // for (const wallet of wallets) {
  //   try {
  //     const { startDate, endDate, newMetrics, updatedMetrics } = await recordWalletAnalyticsForWeek(wallet, week);
  //     log.info(`Created daily stats for wallet`, {
  //       newMetrics: newMetrics.length,
  //       chainType: wallet.chainType,
  //       updatedMetrics: updatedMetrics.length,
  //       walletAddress: wallet.address,
  //       walletId: wallet.id,
  //       week,
  //       startDate,
  //       endDate
  //     });
  //   } catch (error) {
  //     log.error(`Error creating metrics for wallet`, {
  //       chainType: wallet.chainType,
  //       address: wallet.address,
  //       week,
  //       walletId: wallet.id,
  //       error
  //     });
  //   }
  // }
  const contracts = await prisma.scoutProjectContract.findMany({
    where: {
      OR: [
        {
          deletedAt: null,
          chainId: {
            not: {
              in: [taiko.id, taikoTestnetSepolia.id]
            }
          }
        }
      ]
    },
    select: {
      id: true,
      address: true,
      chainId: true,
      projectId: true
    }
  });

  log.debug(`Found ${contracts.length} contracts to process with Dune Analytics`);

  for (const contract of contracts) {
    try {
      const { startDate, endDate, newDailyStats, updatedDailyStats } = await recordContractAnalyticsForWeek(
        contract,
        week
      );
      log.info(`Created daily stats for contract`, {
        newDailyStats: newDailyStats.length,
        updatedMetrics: updatedDailyStats.length,
        walletId: contract.id,
        week,
        startDate,
        endDate
      });
    } catch (error) {
      log.error(`Error creating daily stats for contract`, {
        address: contract.address,
        week,
        contractId: contract.id,
        error
      });
    }
  }

  // create builder events conditionally based on on each project's contracts
  const projectIds = new Set(contracts.map((c) => c.projectId));
  for (const projectId of projectIds) {
    const builderEvents = await getNewProjectAchievements(projectId, week);
    if (builderEvents.length > 0) {
      for (const event of builderEvents) {
        await saveProjectAchievement(event, week);
      }
    }
  }
}
