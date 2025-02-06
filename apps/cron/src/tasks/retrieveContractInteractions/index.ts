import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getLogs, getTransactionReceipt, getBlock } from '@packages/blockchain/provider/ankr/client';
import type { SupportedChainId } from '@packages/blockchain/provider/ankr/request';
import { toJson } from '@packages/utils/json';
import type Koa from 'koa';
import type { Address } from 'viem';

const log = getLogger('cron-retrieve-contract-interactions');

// retrieve 900 logs at a time
const defaultPageSize = BigInt(900);

export async function retrieveContractInteractions(ctx: Koa.Context, { contractIds }: { contractIds?: string[] } = {}) {
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
  log.info('Analyzing interactions for', contracts.length, 'contracts...');

  // keep track of the window start per chain, so we reduce lookups
  // look back 30 days
  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const windowStarts: Record<string, bigint> = {};

  async function getWindowStart(chainId: SupportedChainId) {
    if (!windowStarts[chainId]) {
      windowStarts[chainId] = (await getBlockByDate({ date: windowStart, chainId })).number;
    }
    return windowStarts[chainId];
  }

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
        : await getWindowStart(contract.chainId as SupportedChainId);

      // log.info(`Processing contract ${contract.address} from block ${fromBlock} to ${latestBlock}`);

      await retrieveContractLogs({
        address: contract.address as Address,
        fromBlock,
        toBlock: latestBlock,
        contractId: contract.id,
        chainId: contract.chainId as SupportedChainId
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
}

// retrieve txs using ankr
async function retrieveContractLogs({
  address,
  fromBlock,
  toBlock,
  contractId,
  pageSize = defaultPageSize,
  chainId
}: {
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  contractId: string;
  pageSize?: bigint;
  chainId: SupportedChainId;
}) {
  for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const endBlock = nextStep > toBlock ? toBlock : nextStep;
    const pollStart = Date.now();

    const logs = await getLogs({
      chainId,
      address,
      fromBlock: currentBlock,
      toBlock: endBlock
    });

    const txHashes = new Set<string>(logs.map((l) => l.transactionHash));

    if (txHashes.size > 0) {
      log.info('Found', logs.length, 'logs and', txHashes.size, 'transactions...');
    }

    const transactions = await Promise.all(
      Array.from(txHashes).map(async (txHash) => {
        const receipt = await getTransactionReceipt({ chainId, txHash: txHash as `0x${string}` });
        const block = await getBlock({ chainId, blockNumber: receipt.blockNumber });
        return { block, receipt };
      })
    );

    if (logs.length > 0) {
      await Promise.all([
        prisma.scoutProjectContractTransaction.createMany({
          data: transactions.map(({ receipt, block }) => ({
            contractId,
            blockNumber: Number(receipt.blockNumber),
            txHash: receipt.transactionHash,
            txData: JSON.parse(toJson(receipt) || '{}'),
            gasUsed: Number(receipt.gasUsed),
            gasPrice: Number(receipt.effectiveGasPrice),
            gasCost: Number(receipt.gasUsed) * Number(receipt.effectiveGasPrice),
            from: receipt.from.toLowerCase(),
            to: receipt.to ? receipt.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
            createdAt: new Date(Number(block.timestamp) * 1000),
            status: receipt.status
          }))
        }),
        // prisma.scoutProjectContractLog.createMany({
        //   data: logs.map((l) => ({
        //     contractId,
        //     blockNumber: Number(l.blockNumber),
        //     txHash: l.transactionHash,
        //     from: l.address.toLowerCase(),
        //     logIndex: Number(l.logIndex)
        //   }))
        // }),
        // Record this poll event
        prisma.scoutProjectContractPollEvent.create({
          data: {
            contractId,
            fromBlockNumber: currentBlock,
            toBlockNumber: endBlock,
            processedAt: new Date(),
            processTime: Date.now() - pollStart
          }
        })
      ]);
    }

    const progress = Number(((currentBlock - fromBlock) * BigInt(100)) / (toBlock - fromBlock));
    if (progress % 10 === 0) {
      log.debug(`Processed up to block ${endBlock} (${progress}% complete)`);
    }
  }
}
