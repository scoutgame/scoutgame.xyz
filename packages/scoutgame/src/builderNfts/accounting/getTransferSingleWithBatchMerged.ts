import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { prettyPrint } from '@packages/utils/strings';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { builderNftChain, getBuilderContractAddress, getBuilderStarterPackContractAddress } from '../constants';

import type { BlockRange } from './convertBlockRange';
import { convertBlockRange } from './convertBlockRange';
import { type TransferSingleEvent, getTransferSingleEvents, transferSingleAbi } from './getTransferSingleEvents';

type TransferBatchEvent = {
  eventName: 'TransferBatch';
  args: { operator: Address; from: Address; to: Address; ids: bigint[]; values: bigint[] };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

const transferBatchAbi = {
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
  contractAddress = getBuilderContractAddress(),
  chainId = builderNftChain.id
}: BlockRange & { contractAddress?: Address; chainId?: number }): Promise<TransferBatchEvent[]> {
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
    blockNumber: batchEvent.blockNumber
  }));
}

export async function getTransferSingleWithBatchMerged({
  fromBlock,
  toBlock,
  contractAddress = getBuilderContractAddress(),
  chainId = builderNftChain.id
}: BlockRange & { contractAddress?: Address; chainId?: number }): Promise<TransferSingleEvent[]> {
  const [singleEvents, batchEvents] = await Promise.all([
    getTransferSingleEvents({ fromBlock, toBlock, contractAddress, chainId }),
    getTransferBatchEvents({ fromBlock, toBlock, contractAddress, chainId })
  ]);

  const convertedBatchEvents = await Promise.all(batchEvents.map((event) => convertBatchToSingleEvents(event)));

  return [...singleEvents, ...convertedBatchEvents.flat()].sort(
    (a, b) => Number(a.blockNumber) - Number(b.blockNumber)
  );
}
