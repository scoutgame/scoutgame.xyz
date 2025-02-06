import type { Address, Block, TransactionReceipt } from 'viem';

import type { SupportedChainId } from './request';
import { ankrRequest } from './request';

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

// note: the generic types are: TransactionReceipt<quantity, index, status, type>
export type GetTransactionReceiptResult = TransactionReceipt<string, string, '0x1', '0x0'>;

export function getTransactionReceipt({ chainId, txHash }: { chainId: SupportedChainId; txHash: string }) {
  return ankrRequest<GetTransactionReceiptResult>({ chainId, method: 'eth_getTransactionReceipt', params: [txHash] });
}

// ref: https://www.ankr.com/docs/rpc-service/chains/chains-api/ethereum/#eth_getblockbynumber
export function getBlock({ chainId, blockNumber }: { chainId: SupportedChainId; blockNumber: string }) {
  const transactionDetailFlag = false;
  return ankrRequest<Block>({
    chainId,
    method: 'eth_getBlockByNumber',
    params: [blockNumber, transactionDetailFlag]
  });
}
