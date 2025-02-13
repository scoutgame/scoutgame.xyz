import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { maxRecords, getWalletTransactions } from '@packages/blockchain/provider/taikoscan/client';
import type { SupportedChainId } from '@packages/blockchain/provider/taikoscan/request';
import type { Address } from 'viem';

const log = getLogger('cron-retrieve-wallet-transactions');

export async function retrieveWalletTransactions({
  chainId,
  contractId,
  address,
  fromBlock,
  toBlock
}: {
  chainId: SupportedChainId;
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
        const lastBlock = result[result.length - 1].blockNumber;
        log.info(
          `Retrieved ${result.length} transactions for wallet ${address} (page ${currentPage}, block: ${lastBlock})`
        );
        allTransactions.push(...result);
      }

      if (allTransactions.length < maxRecords) {
        break;
      } else {
        currentPage += 1;
      }
    } catch (error) {
      log.error('Error retrieving wallet transactions', { error, address, currentPage });
      throw error;
    }
  }

  log.info(`Retrieved total of ${allTransactions.length} transactions for wallet ${address}`);
  return allTransactions;
}
