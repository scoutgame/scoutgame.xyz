import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { RateLimit } from 'async-sema';
import type { Address } from 'viem';
import { getAddress, parseEventLogs } from 'viem';

import { scoutProtocolAddress, protocolStartBlock, scoutProtocolChainId } from '../../protocol/constants';

import { convertBlockRange, type BlockRange } from './convertBlockRange';

// copied this rate from ankr provider
const rateLimiter = RateLimit(10, { uniformDistribution: true });

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

function getTokensClaimedEvents({
  userAddress,
  chainId,
  contractAddress,
  fromBlock,
  toBlock
}: BlockRange & { chainId: number; userAddress: Address; contractAddress: Address }): Promise<TokensClaimedEvent[]> {
  return getPublicClient(chainId)
    .getLogs({
      ...convertBlockRange({ fromBlock, toBlock }),
      address: contractAddress,
      event: tokensClaimedAbi,
      args: { user: getAddress(userAddress) }
    })
    .then((logs) =>
      parseEventLogs({
        abi: [tokensClaimedAbi],
        logs,
        eventName: 'TokensClaimed'
      })
    );
}

// Paginate requests with a maximum range of 100,000 blocks
const MAX_BLOCK_RANGE = 100000;

export async function getTokensClaimedEventsPaginated({
  userAddress,
  contractAddress = scoutProtocolAddress,
  fromBlock = BigInt(protocolStartBlock),
  chainId = scoutProtocolChainId
}: {
  userAddress: Address;
  contractAddress?: Address;
  fromBlock?: bigint;
  chainId?: number;
}): Promise<TokensClaimedEvent[]> {
  const publicClient = getPublicClient(chainId);
  const latestBlock = Number(await publicClient.getBlockNumber());
  const startBlock = fromBlock || 0;

  // Ensure we process at least one block when fromBlock equals toBlock
  const blocksToProcess = Number(latestBlock) - Number(startBlock) + 1;
  const iterations = Math.max(1, Math.ceil(blocksToProcess / MAX_BLOCK_RANGE));
  // console.log('iterations', iterations, blocksToProcess);
  let results: TokensClaimedEvent[] = [];
  for (let i = 0; i < iterations; i++) {
    const currentBlock = Number(startBlock) + i * MAX_BLOCK_RANGE;
    const endBlock = Math.min(currentBlock + MAX_BLOCK_RANGE - 1, Number(latestBlock));

    await rateLimiter();

    const events = await getTokensClaimedEvents({
      fromBlock: BigInt(currentBlock),
      toBlock: BigInt(endBlock),
      contractAddress,
      userAddress,
      chainId
    });

    results = [...results, ...events];
  }

  return results.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));
}
