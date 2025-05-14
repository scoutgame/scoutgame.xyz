import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { nftChain } from '../constants';

import type { BlockRange } from './convertBlockRange';
import { convertBlockRange } from './convertBlockRange';
import { type TransferSingleEvent, getTransferSingleEvents } from './getTransferSingleEvents';

type TransferBatchEvent = {
  eventName: 'TransferBatch';
  args: { operator: Address; from: Address; to: Address; ids: bigint[]; values: bigint[] };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
};

export const transferBatchAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
    { indexed: true, internalType: 'address', name: 'from', type: 'address' },
    { indexed: true, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' }
  ],
  name: 'TransferBatch',
  type: 'event'
} as const;

function getTransferBatchEvents({
  fromBlock,
  toBlock,
  contractAddress,
  chainId = nftChain.id
}: BlockRange & { contractAddress: Address; chainId?: number }): Promise<TransferBatchEvent[]> {
  return getPublicClient(chainId)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: contractAddress,
      event: transferBatchAbi
    })
    .then((logs) =>
      parseEventLogs({
        abi: [transferBatchAbi],
        logs,
        eventName: 'TransferBatch'
      })
    ) as Promise<TransferBatchEvent[]>;
}

function convertBatchToSingleEvents(batchEvent: TransferBatchEvent): TransferSingleEvent[] {
  return batchEvent.args.ids.map((id, index) => ({
    eventName: 'TransferSingle',
    args: {
      operator: batchEvent.args.operator,
      from: batchEvent.args.from,
      to: batchEvent.args.to,
      id,
      value: batchEvent.args.values[index]
    },
    transactionHash: batchEvent.transactionHash,
    blockNumber: batchEvent.blockNumber,
    logIndex: batchEvent.logIndex
  }));
}

// Paginate requests with a maximum range of 100,000 blocks
const MAX_BLOCK_RANGE = 90_000;

export async function getTransferSingleWithBatchMerged({
  fromBlock,
  toBlock,
  contractAddress,
  chainId = nftChain.id
}: BlockRange & { contractAddress: Address; chainId?: number }): Promise<TransferSingleEvent[]> {
  const publicClient = getPublicClient(chainId);
  const latestBlock = toBlock || Number(await publicClient.getBlockNumber());
  const startBlock = fromBlock || 0;

  let singleEvents: TransferSingleEvent[] = [];
  let batchEvents: TransferBatchEvent[] = [];

  // Ensure we process at least one block when fromBlock equals toBlock
  const blocksToProcess = Number(latestBlock) - Number(startBlock) + 1;
  const iterations = Math.max(1, Math.ceil(blocksToProcess / MAX_BLOCK_RANGE));
  for (let i = 0; i < iterations; i++) {
    const currentBlock = Number(startBlock) + i * MAX_BLOCK_RANGE;
    const endBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, Number(latestBlock));
    const [pageSingleEvents, pageBatchEvents] = await Promise.all([
      getTransferSingleEvents({
        fromBlock: BigInt(currentBlock),
        toBlock: BigInt(endBlock),
        contractAddress,
        chainId
      }),
      getTransferBatchEvents({
        fromBlock: BigInt(currentBlock),
        toBlock: BigInt(endBlock),
        contractAddress,
        chainId
      })
    ]);

    singleEvents = [...singleEvents, ...pageSingleEvents];
    batchEvents = [...batchEvents, ...pageBatchEvents];
  }

  const convertedBatchEvents = await Promise.all(batchEvents.map((event) => convertBatchToSingleEvents(event)));

  return [...singleEvents, ...convertedBatchEvents.flat()].sort(
    (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
  );
}
