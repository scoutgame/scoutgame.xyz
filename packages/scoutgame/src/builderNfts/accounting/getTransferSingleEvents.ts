import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { builderNftChain, getBuilderNftContractAddress, getBuilderNftStarterPackContractAddress } from '../constants';

import type { BlockRange } from './convertBlockRange';
import { convertBlockRange } from './convertBlockRange';

export const transferSingleAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
    { indexed: true, internalType: 'address', name: 'from', type: 'address' },
    { indexed: true, internalType: 'address', name: 'to', type: 'address' },
    { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
  ],
  name: 'TransferSingle',
  type: 'event'
} as const;

export type TransferSingleEvent = {
  eventName: 'TransferSingle';
  args: { operator: Address; from: Address; to: Address; id: bigint; value: bigint };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

export function getTransferSingleEvents({
  fromBlock,
  toBlock,
  contractAddress = getBuilderNftContractAddress(),
  chainId = builderNftChain.id
}: BlockRange & { contractAddress?: Address; chainId?: number }): Promise<TransferSingleEvent[]> {
  return getPublicClient(chainId)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: contractAddress,
      event: transferSingleAbi
    })
    .then((logs) =>
      parseEventLogs({
        abi: [transferSingleAbi],
        logs,
        eventName: 'TransferSingle'
      })
    );
}

export function getStarterPackTransferSingleEvents({
  fromBlock,
  toBlock,
  season
}: BlockRange & { season?: ISOWeek }): Promise<TransferSingleEvent[]> {
  return getPublicClient(builderNftChain.id)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: getBuilderNftStarterPackContractAddress(season),
      event: transferSingleAbi
    })
    .then((logs) =>
      parseEventLogs({
        abi: [transferSingleAbi],
        logs,
        eventName: 'TransferSingle'
      })
    );
}
