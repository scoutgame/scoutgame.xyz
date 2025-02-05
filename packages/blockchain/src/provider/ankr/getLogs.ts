import type { Address } from 'viem';

import type { SupportedChainId } from './client';
import { ankrRequest } from './client';

export type GetLogsResult = {
  address: Address; // the contract address
  topics: string[];
  data: string;
  blockNumber: string;
  blockHash: string;
  transactionHash: string;
  transactionIndex: string;
  removed: boolean;
  logIndex: string;
}[];

// see supported APIs by taiko: https://www.ankr.com/docs/rpc-service/chains/chains-api/taiko/#eth_gettransactionbyhash
export async function getLogs({
  chainId,
  address,
  fromBlock,
  toBlock
}: {
  chainId: SupportedChainId;
  address: string | string[];
  fromBlock?: bigint;
  toBlock?: bigint;
}) {
  return ankrRequest<GetLogsResult>({
    chainId,
    method: 'eth_getLogs',
    params: [
      {
        address,
        fromBlock: fromBlock ? `0x${fromBlock.toString(16)}` : undefined,
        toBlock: toBlock ? `0x${toBlock.toString(16)}` : undefined
      }
    ]
  });
}
