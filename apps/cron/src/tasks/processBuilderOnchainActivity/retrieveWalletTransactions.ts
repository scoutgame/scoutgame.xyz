import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getWalletTransactions } from '@packages/blockchain/provider/taikoscan/client';
import type { Address } from 'viem';

const log = getLogger('cron-retrieve-wallet-transactions');

export async function retrieveWalletTransactions({
  contractId,
  address,
  fromBlock,
  toBlock
}: {
  contractId: string;
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
}) {
  const allTransactions: Awaited<ReturnType<typeof getWalletTransactions>> = [];
  let currentPage = 1;

  while (true) {
    try {
      const result = await getWalletTransactions({
        address,
        fromBlock,
        toBlock,
        page: currentPage
      });

      if (result.length > 0) {
        log.info(`Retrieved ${result.length} transactions for wallet ${address} (page ${currentPage})`);
        allTransactions.push(...result);
      } else {
        break;
      }

      currentPage += 1;
    } catch (error) {
      log.error('Error retrieving wallet transactions', { error, address, currentPage });
      throw error;
    }
  }

  log.info(`Retrieved total of ${allTransactions.length} transactions for wallet ${address}`);
  return allTransactions;
}
