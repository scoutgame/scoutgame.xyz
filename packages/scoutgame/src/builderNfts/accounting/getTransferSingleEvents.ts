import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { prettyPrint } from '@packages/utils/strings';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';
import { optimism } from 'viem/chains';

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
  logIndex: number;
  blockNumber: bigint;
};

export function getTransferSingleEvents({
  fromBlock,
  toBlock,
  contractAddress,
  chainId
}: BlockRange & { contractAddress: Address; chainId: number }): Promise<TransferSingleEvent[]> {
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
