import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { AbiEvent, Address, ParseEventLogsReturnType } from 'viem';
import { parseEventLogs } from 'viem';

import { getPublicClient } from './getPublicClient';

// Paginate requests with a maximum range of 100,000 blocks
const MAX_BLOCK_RANGE = 20_000;

type LogEvent = {
  eventName: string;
  args: { operator: Address; from: Address; to: Address; id: bigint; value: bigint };
  transactionHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
};

// paginate through the result of client.getLogs
export async function getContractLogs<T>({
  fromBlock,
  toBlock,
  batchSize = MAX_BLOCK_RANGE,
  contractAddress,
  chainId,
  eventAbi,
  eventName
}: {
  fromBlock: bigint;
  toBlock?: bigint;
  batchSize?: number;
  contractAddress: Address;
  chainId: number;
  eventAbi: AbiEvent;
  eventName: string;
}): Promise<T[]> {
  // Step 2: Get the public client for the chain
  const client = getPublicClient(chainId);
  const contractCacheRecord = await prisma.blockchainLogsContract.upsert({
    where: {
      contractAddress_chainId_eventName: {
        chainId,
        contractAddress,
        eventName
      }
    },
    update: {},
    create: {
      chainId,
      contractAddress,
      eventName,
      firstBlockNumber: fromBlock
    }
  });
  const dbLogs = await prisma.blockchainLog.findMany({
    where: {
      contractId: contractCacheRecord.id,
      eventName
    },
    orderBy: {
      blockNumber: 'asc'
    }
  });
  const formattedDbLogs: LogEvent[] = dbLogs.map((l) => ({
    ...l,
    transactionHash: l.txHash as `0x${string}`,
    args: l.args as any
  }));
  const startBlock = contractCacheRecord.lastBlockNumber ? contractCacheRecord.lastBlockNumber + BigInt(1) : fromBlock;
  const latestBlock = toBlock || Number(await client.getBlockNumber());

  let events: ParseEventLogsReturnType<AbiEvent[], string, true, string> = [];

  // Ensure we process at least one block when fromBlock equals toBlock
  const blocksToProcess = Number(latestBlock) - Number(startBlock) + 1;
  const iterations = blocksToProcess > 0 ? Math.max(1, Math.ceil(blocksToProcess / batchSize)) : 0;

  for (let i = 0; i < iterations; i++) {
    const currentBlock = Number(startBlock) + i * batchSize;
    const endBlock = Math.min(currentBlock + batchSize - 1, Number(latestBlock));

    const nextEvents = await (async () => {
      async function getLogs() {
        const logs = await client.getLogs({
          fromBlock: BigInt(currentBlock),
          toBlock: BigInt(endBlock),
          address: contractAddress,
          event: eventAbi
        });
        return parseEventLogs({
          abi: [eventAbi],
          logs,
          eventName
        });
      }
      try {
        return await getLogs();
      } catch (error) {
        log.warn(`Retrying request for logs ${currentBlock}-${endBlock}:`, error);
        return getLogs();
      }
    })();
    if (nextEvents.length > 0) {
      await Promise.all(
        nextEvents.map((event) =>
          prisma.blockchainLog.upsert({
            where: {
              contractId_blockNumber_logIndex: {
                contractId: contractCacheRecord.id,
                blockNumber: event.blockNumber,
                logIndex: event.logIndex
              }
            },
            create: {
              contractId: contractCacheRecord.id,
              args: event.args as any,
              blockNumber: event.blockNumber,
              eventName,
              txHash: event.transactionHash,
              logIndex: event.logIndex
            },
            update: {}
          })
        )
      );
    }
    await prisma.blockchainLogsContract.update({
      where: {
        id: contractCacheRecord.id
      },
      data: {
        lastBlockNumber: endBlock
      }
    });

    events = [...events, ...nextEvents];
  }

  return [...formattedDbLogs, ...events] as T[];
}
