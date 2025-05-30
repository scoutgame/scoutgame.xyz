import { prisma } from '@charmverse/core/prisma-client';
import type { AbiEvent, Address, ParseEventLogsReturnType } from 'viem';
import { parseEventLogs } from 'viem';

import { getPublicClient } from './getPublicClient';

// Paginate requests with a maximum range of 100,000 blocks
const MAX_BLOCK_RANGE = 90_000;

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
  contractAddress,
  chainId,
  eventAbi,
  eventName
}: {
  fromBlock: bigint;
  toBlock?: bigint;
  contractAddress: Address;
  chainId: number;
  eventAbi: AbiEvent;
  eventName: string;
}): Promise<T[]> {
  // Step 2: Get the public client for the chain
  const client = getPublicClient(chainId);
  const contractCacheRecord = await prisma.blockchainLogsContract.upsert({
    where: {
      contractAddress_chainId: {
        chainId,
        contractAddress
      }
    },
    update: {},
    create: {
      chainId,
      contractAddress,
      firstBlockNumber: fromBlock
    }
  });
  const dbLogs = await prisma.blockchainLog.findMany({
    where: {
      contractId: contractCacheRecord.id
    },
    orderBy: {
      blockNumber: 'asc'
    }
  });
  const formattedDbLogs: LogEvent[] = dbLogs.map((log) => ({
    ...log,
    transactionHash: log.txHash as `0x${string}`,
    args: log.args as any
  }));
  const startBlock = contractCacheRecord.lastBlockNumber ? contractCacheRecord.lastBlockNumber + BigInt(1) : fromBlock;
  const latestBlock = toBlock || Number(await client.getBlockNumber());

  let events: ParseEventLogsReturnType<AbiEvent[], string, true, string> = [];

  // Ensure we process at least one block when fromBlock equals toBlock
  const blocksToProcess = Number(latestBlock) - Number(startBlock) + 1;
  const iterations = Math.max(1, Math.ceil(blocksToProcess / MAX_BLOCK_RANGE));
  for (let i = 0; i < iterations; i++) {
    const currentBlock = Number(startBlock) + i * MAX_BLOCK_RANGE;
    const endBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, Number(latestBlock));
    const nextEvents = await client
      .getLogs({
        fromBlock: BigInt(currentBlock),
        toBlock: BigInt(endBlock),
        address: contractAddress,
        event: eventAbi
      })
      .then((logs) =>
        parseEventLogs({
          abi: [eventAbi],
          logs,
          eventName
        })
      );

    if (nextEvents.length > 0) {
      await prisma.blockchainLog.createMany({
        data: nextEvents.map((event) => ({
          contractId: contractCacheRecord.id,
          args: event.args as any,
          blockNumber: event.blockNumber,
          eventName,
          txHash: event.transactionHash,
          logIndex: event.logIndex
        }))
      });
    }

    await prisma.blockchainLogsContract.update({
      where: {
        contractAddress_chainId: {
          contractAddress,
          chainId
        }
      },
      data: {
        lastBlockNumber: endBlock
      }
    });

    events = [...events, ...nextEvents];
  }

  return [...formattedDbLogs, ...events] as T[];
}
