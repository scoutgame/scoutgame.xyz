import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { getScoutProtocolAddress } from '../../protocol/constants';
import { builderNftChain } from '../constants';

import { type BlockRange } from './convertBlockRange';

const tokensClaimedAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: 'address',
      name: 'user',
      type: 'address'
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'amount',
      type: 'uint256'
    },
    {
      indexed: false,
      internalType: 'string',
      name: 'week',
      type: 'string'
    },
    {
      indexed: true,
      internalType: 'bytes32',
      name: 'merkleRoot',
      type: 'bytes32'
    }
  ],
  name: 'TokensClaimed',
  type: 'event'
} as const;

export type TokensClaimedEvent = {
  eventName: 'TokensClaimed';
  args: { user: Address; amount: bigint; week: string; merkleRoot: `0x${string}` };
  transactionHash: `0x${string}`;
  blockNumber: bigint;
};

export function getTokensClaimedEvents({ address }: BlockRange & { address: Address }): Promise<TokensClaimedEvent[]> {
  return getPublicClient(builderNftChain.id)
    .getLogs({
      address: getScoutProtocolAddress(),
      event: tokensClaimedAbi,
      args: { user: address }
    })
    .then((logs) =>
      parseEventLogs({
        abi: [tokensClaimedAbi],
        logs,
        eventName: 'TokensClaimed'
      })
    );
}
