import { getContractLogs } from '@packages/blockchain/getContractLogs';
import type { Address } from 'viem';

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
}: {
  fromBlock: bigint;
  toBlock?: bigint;
  contractAddress: Address;
  chainId: number;
}): Promise<TransferSingleEvent[]> {
  return getContractLogs({
    fromBlock,
    toBlock,
    chainId,
    contractAddress,
    eventAbi: transferSingleAbi,
    eventName: 'TransferSingle'
  }) as Promise<TransferSingleEvent[]>;
}
