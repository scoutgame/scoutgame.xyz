import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getBlockNumberByDateCached } from '@packages/blockchain/getBlockByDate';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getLogs, getTransactionReceipt, getBlock } from '@packages/blockchain/provider/ankr/client';
import type { SupportedChainId } from '@packages/blockchain/provider/ankr/request';
import { toJson } from '@packages/utils/json';
import type Koa from 'koa';
import type { Address } from 'viem';

import { retrieveContractTransactions } from './retrieveContractTransactions';
import { retrieveWalletTransactions } from './retrieveWalletTransactions';

const log = getLogger('cron-process-builder-onchain-activity');

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
  log.info('Analyzing interactions for', contracts.length, 'contracts...', { windowStart });

  for (const contract of contracts) {
    try {
      const pollStart = Date.now();
      const client = getPublicClient(contract.chainId);
      const latestBlock = await client.getBlockNumber();
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
        : await getBlockNumberByDateCached({ date: windowStart, chainId: contract.chainId });

      // log.info(`Processing contract ${contract.address} from block ${fromBlock} to ${latestBlock}`);

      if (contract.type === 'contract') {
        await retrieveContractTransactions({
          address: contract.address as Address,
          fromBlock,
          toBlock: latestBlock,
          contractId: contract.id,
          chainId: contract.chainId as SupportedChainId
        });
      } else {
        await retrieveWalletTransactions({
          address: contract.address as Address,
          fromBlock,
          toBlock: latestBlock,
          contractId: contract.id,
          chainId: contract.chainId as SupportedChainId
        });
      }

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
}
