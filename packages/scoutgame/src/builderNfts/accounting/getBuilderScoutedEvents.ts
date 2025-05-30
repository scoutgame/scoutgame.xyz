import { getContractLogs } from '@packages/blockchain/getContractLogs';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { nftChain } from '../constants';

import { convertBlockRange, type BlockRange } from './convertBlockRange';

export const builderScoutedAbi = {
  anonymous: false,
  inputs: [
    { indexed: false, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    { indexed: false, internalType: 'string', name: 'scout', type: 'string' }
  ],
  name: 'BuilderScouted',
  type: 'event'
} as const;

export type BuilderScoutedEvent = {
  eventName: 'BuilderScouted';
  args: { tokenId: bigint; amount: bigint; scout: string };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

function ignoreEvent(ev: BuilderScoutedEvent) {
  // Ignore internal team token ids, and test token 163
  if (ev.args.tokenId <= BigInt(8) || ev.args.tokenId === BigInt(163)) {
    return true;

    // Ignore the old series of mints where a cron issued too many tokens
  } else if (
    ev.args.scout !== 'c9d7406a-1ec6-4204-9abc-d29ff4708cb5' ||
    ev.args.amount !== BigInt(1) ||
    ev.args.tokenId !== BigInt(27) ||
    // Taking block Sunday Nov.17 as reference
    ev.blockNumber >= BigInt(128_130_914)
  ) {
    return false;
  } else {
    return true;
  }
}

export async function getBuilderScoutedEvents({
  contractAddress,
  chainId = nftChain.id,
  fromBlock
}: {
  contractAddress: Address;
  chainId?: number;
  fromBlock: bigint;
}): Promise<BuilderScoutedEvent[]> {
  return (
    await getContractLogs<BuilderScoutedEvent>({
      fromBlock,
      contractAddress,
      chainId,
      eventAbi: builderScoutedAbi,
      eventName: 'BuilderScouted'
    })
  ).filter((ev) => !ignoreEvent(ev));
}
