import type { TransactionReceipt } from 'viem';
import { Address, createPublicClient, http } from 'viem';

import type { SupportedChainId } from './client';
import { ankrRequest } from './client';

// note: the generic types are: TransactionReceipt<quantity, index, status, type>
type GetTransactionReceiptResult = TransactionReceipt<string, string, '0x1', '0x0'>;

export function getTransactionReceipt({ chainId, txHash }: { chainId: SupportedChainId; txHash: string }) {
  return ankrRequest<GetTransactionReceiptResult>({ chainId, method: 'eth_getTransactionReceipt', params: [txHash] });
}
