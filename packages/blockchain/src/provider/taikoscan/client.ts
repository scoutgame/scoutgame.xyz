import { taikoRequest } from './request';

type WalletTransactionsResponse = { blockNumber: bigint; txHash: string };

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
