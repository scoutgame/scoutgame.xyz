import { taikoRequest } from './request';

export async function getWalletTransactions({
  address,
  fromBlock,
  endBlock
}: {
  address: string;
  fromBlock: bigint;
  endBlock: bigint;
}) {
  return taikoRequest({
    module: 'account',
    action: 'txlist',
    address,
    startblock: fromBlock,
    endblock: endBlock,
    page: 1,
    // offset: 2,
    sort: 'asc'
  });
}
