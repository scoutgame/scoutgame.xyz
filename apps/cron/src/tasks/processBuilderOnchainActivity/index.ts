import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type Koa from 'koa';
import memoize from 'lodash.memoize'; //
import type { Address } from 'viem';
import { taiko } from 'viem/chains';

import { processContractTransactions } from './processContractTransactions';
import { processWalletTransactions } from './processWalletTransactions';

const log = getLogger('cron-process-builder-onchain-activity');

const getLatestBlockMemoized = memoize(async (chainId: number) => {
  const client = getPublicClient(chainId);
  return client.getBlockNumber();
});

const getBlockByDateMemoized = memoize(
  getBlockByDate,
  // define cache key
  ({ date, chainId }) => `${date.toISOString()}-${chainId}`
);

export async function processBuilderOnchainActivity(
  ctx: Koa.Context,
  { contractIds }: { contractIds?: string[] } = {}
) {
  // look back 30 days
  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const contracts = await prisma.scoutProjectContract.findMany(
    contractIds
      ? {
          where: {
            id: {
              in: contractIds
            }
          }
        }
      : undefined
  );
  log.info(`Analyzing interactions for ${contracts.length} contracts...`, { windowStart });

  for (const contract of contracts) {
    try {
      const pollStart = Date.now();
      const latestBlock = await getLatestBlockMemoized(contract.chainId);
      // Get the last poll event for this contract
      const lastPollEvent = await prisma.scoutProjectContractPollEvent.findFirst({
        where: {
          contractId: contract.id
        },
        orderBy: {
          toBlockNumber: 'desc'
        }
      });

      const fromBlock = lastPollEvent
        ? lastPollEvent.toBlockNumber + BigInt(1)
        : (await getBlockByDateMemoized({ date: windowStart, chainId: contract.chainId })).number;
      // log.info(`Processing contract ${contract.address} from block ${fromBlock} to ${latestBlock}`);

      await processContractTransactions({
        address: contract.address as Address,
        fromBlock,
        toBlock: latestBlock,
        contractId: contract.id,
        chainId: contract.chainId
      });

      const durationMins = ((Date.now() - pollStart) / 1000 / 60).toFixed(2);
      log.info(
        `Processed contract ${contract.address} from block ${fromBlock} to ${latestBlock} in ${durationMins} minutes`
      );
    } catch (error) {
      log.error('Error processing contract:', {
        error,
        chainId: contract.chainId,
        address: contract.address
      });
    }
  }

  const wallets = await prisma.scoutProjectWallet.findMany({
    where: {
      chainId: taiko.id
    }
  });
  log.info(`Retrieving transactions for ${wallets.length} wallets on taiko...`, { windowStart });

  for (const wallet of wallets) {
    try {
      const pollStart = Date.now();
      const latestBlock = await getLatestBlockMemoized(wallet.chainId!);
      // Get the last poll event for this contract
      const lastPollEvent = await prisma.scoutProjectWalletPollEvent.findFirst({
        where: {
          walletId: wallet.id
        },
        orderBy: {
          toBlockNumber: 'desc'
        }
      });

      const fromBlock = lastPollEvent
        ? lastPollEvent.toBlockNumber + BigInt(1)
        : (await getBlockByDateMemoized({ date: windowStart, chainId: wallet.chainId! })).number;

      // log.info(`Processing contract ${contract.address} from block ${fromBlock} to ${latestBlock}`);

      await processWalletTransactions({
        address: wallet.address as Address,
        fromBlock,
        toBlock: latestBlock,
        walletId: wallet.id,
        chainId: wallet.chainId!
      });

      const durationMins = ((Date.now() - pollStart) / 1000 / 60).toFixed(2);
      log.info(
        `Processed wallet ${wallet.address} from block ${fromBlock} to ${latestBlock} in ${durationMins} minutes`
      );
    } catch (error) {
      log.error('Error processing contract:', {
        error,
        chainId: wallet.chainId,
        address: wallet.address
      });
    }
  }
}
