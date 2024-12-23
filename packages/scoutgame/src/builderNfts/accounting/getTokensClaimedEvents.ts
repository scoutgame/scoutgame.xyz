import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { prettyPrint } from '@packages/utils/strings';
import type { Address } from 'viem';
import { getAddress, parseEventLogs } from 'viem';

import { getScoutProtocolAddress, protocolStartBlock, scoutProtocolChainId } from '../../protocol/constants';

import { convertBlockRange, type BlockRange } from './convertBlockRange';

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

export function getTokensClaimedEvents({
  address,
  fromBlock = protocolStartBlock,
  toBlock
}: BlockRange & { address: Address }): Promise<TokensClaimedEvent[]> {
  return getPublicClient(scoutProtocolChainId)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: getScoutProtocolAddress(),
      event: tokensClaimedAbi,
      args: { user: getAddress(address) }
    })
    .then((logs) =>
      parseEventLogs({
        abi: [tokensClaimedAbi],
        logs,
        eventName: 'TokensClaimed'
      })
    );
}
