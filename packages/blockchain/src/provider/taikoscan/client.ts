import type { Address } from 'viem';

import type { Params } from './request';
import { taikoRequest } from './request';

type WalletTransactionsResponse = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
};

export const maxRecords = 10000;

// @see: https://docs.taikoscan.io/api-endpoints/accounts#get-a-list-of-normal-transactions-by-address
export async function getWalletTransactions({
  address,
  fromBlock,
  toBlock,
  page = 1
}: {
  address: string;
  fromBlock: bigint;
  toBlock: bigint;
  page?: number;
}) {
  return taikoRequest<WalletTransactionsResponse[]>({
    module: 'account',
    action: 'txlist',
    address,
    startblock: fromBlock,
    endblock: toBlock,
    page,
    // offset: 2,
    sort: 'asc'
  });
}

// in case we need them
export async function getContractSourceCode(address: string) {
  return taikoRequest({
    module: 'contract',
    action: 'getsourcecode',
    address
  });
}

export async function getContractCreation(address: string) {
  return taikoRequest<
    { contractAddress: Address; contractCreator: Address; txHash: string }[],
    Params & { contractaddresses: string }
  >({
    module: 'contract',
    action: 'getcontractcreation',
    contractaddresses: address
  });
}
