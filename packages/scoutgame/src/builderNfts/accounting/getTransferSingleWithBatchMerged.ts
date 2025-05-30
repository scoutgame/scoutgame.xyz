import { getContractLogs } from '@packages/blockchain/getContractLogs';
import type { Address } from 'viem';

import { nftChain } from '../constants';

import type { BlockRange } from './convertBlockRange';
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
}: {
  fromBlock: bigint;
  toBlock?: bigint;
  contractAddress: Address;
  chainId?: number;
}): Promise<TransferBatchEvent[]> {
  return getContractLogs({
    fromBlock: BigInt(fromBlock),
    toBlock: toBlock ? BigInt(toBlock) : undefined,
    chainId,
    contractAddress,
    eventAbi: transferBatchAbi,
    eventName: 'TransferBatch'
  });
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

export async function getTransferSingleWithBatchMerged({
  fromBlock,
  toBlock,
  contractAddress,
  chainId = nftChain.id
}: BlockRange & {
  fromBlock: number | bigint;
  toBlock?: number | bigint;
  contractAddress: Address;
  chainId?: number;
}): Promise<TransferSingleEvent[]> {
  const [singleEvents, batchEvents] = await Promise.all([
    getTransferSingleEvents({
      fromBlock: BigInt(fromBlock),
      toBlock: toBlock ? BigInt(toBlock) : undefined,
      contractAddress,
      chainId
    }),
    getTransferBatchEvents({
      fromBlock: BigInt(fromBlock),
      toBlock: toBlock ? BigInt(toBlock) : undefined,
      contractAddress,
      chainId
    })
  ]);

  const convertedBatchEvents = batchEvents.flatMap((event) => convertBatchToSingleEvents(event));

  return [...singleEvents, ...convertedBatchEvents].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
}
