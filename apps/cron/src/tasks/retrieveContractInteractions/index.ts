import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getBlockByDate } from '@packages/blockchain/getBlockByDate';
import { toJson } from '@packages/utils/json';
import type Koa from 'koa';
import { createPublicClient, http } from 'viem';
import type { Address } from 'viem';
import { taiko } from 'viem/chains';

const log = getLogger('cron-retrieve-contract-interactions');

// retrieve 900 logs at a time
const defaultPageSize = BigInt(900);

export async function retrieveContractInteractions(ctx: Koa.Context) {
  const client = createPublicClient({
    chain: taiko,
    transport: http()
  });

  const latestBlock = await client.getBlockNumber();
  const contracts = await prisma.scoutProjectContract.findMany();
  log.info('Analyzing interactions for', contracts.length, 'contracts...');

  // keep track of the window start per chain, so we reduce lookups
  // look back 30 days
  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const windowStarts: Record<string, bigint> = {};

  for (const contract of contracts) {
    try {
      const chainId = contract.chainId;
      const firstBlock = windowStarts[chainId] || (await getBlockByDate({ date: windowStart, chainId })).number;
      // Get the last poll event for this contract
      const lastPollEvent = await prisma.scoutProjectContractPollEvent.findFirst({
        where: {
          contractId: contract.id
        },
        orderBy: {
          toBlockNumber: 'desc'
        }
      });
      const pollStart = Date.now();

      const fromBlock = lastPollEvent ? lastPollEvent.toBlockNumber + BigInt(1) : firstBlock;

      log.info(`Processing contract ${contract.address} from block ${fromBlock} to ${latestBlock}`);

      await retrieveContractLogs({
        address: contract.address as Address,
        fromBlock,
        toBlock: latestBlock,
        contractId: contract.id
      });

      // Record this poll event
      await prisma.scoutProjectContractPollEvent.create({
        data: {
          contractId: contract.id,
          fromBlockNumber: fromBlock,
          toBlockNumber: latestBlock,
          processedAt: new Date(),
          processTime: Date.now() - pollStart
        }
      });
    } catch (error) {
      log.error('Error processing contract:', { error, address: contract.address });
    }
  }
}

async function retrieveContractLogs({
  address,
  fromBlock,
  toBlock,
  contractId,
  pageSize = defaultPageSize
}: {
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  contractId: string;
  pageSize?: bigint;
}) {
  const client = createPublicClient({
    chain: taiko,
    transport: http()
  });

  for (let currentBlock = fromBlock; currentBlock <= toBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const endBlock = nextStep > toBlock ? toBlock : nextStep;

    const logs = await client.getLogs({
      address,
      fromBlock: currentBlock,
      toBlock: endBlock
    });

    const txHashes = new Set<string>(logs.map((l) => l.transactionHash));

    if (txHashes.size > 0) {
      log.info('Found', logs.length, 'logs and', txHashes.size, 'transactions...');
    }

    const txData = await Promise.all(
      Array.from(txHashes).map((txHash) => client.getTransactionReceipt({ hash: txHash as `0x${string}` }))
    );

    if (logs.length > 0) {
      await Promise.all([
        prisma.scoutProjectContractTransaction.createMany({
          data: txData.map((tx) => ({
            contractId,
            blockNumber: Number(tx.blockNumber),
            txHash: tx.transactionHash,
            txData: JSON.parse(toJson(tx) || '{}'),
            gasUsed: Number(tx.gasUsed),
            gasPrice: Number(tx.effectiveGasPrice),
            gasCost: Number(tx.gasUsed) * Number(tx.effectiveGasPrice),
            from: tx.from.toLowerCase(),
            to: tx.to ? tx.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
            status: tx.status
          }))
        }),
        prisma.scoutProjectContractLog.createMany({
          data: logs.map((l) => ({
            contractId,
            blockNumber: Number(l.blockNumber),
            txHash: l.transactionHash,
            from: l.address.toLowerCase(),
            logIndex: Number(l.logIndex)
          }))
        })
      ]);
    }

    const progress = Number(((currentBlock - fromBlock) * BigInt(100)) / (toBlock - fromBlock));
    if (progress % 10 === 0) {
      log.debug(`Processed up to block ${endBlock} (${progress}% complete)`);
    }
  }
}
