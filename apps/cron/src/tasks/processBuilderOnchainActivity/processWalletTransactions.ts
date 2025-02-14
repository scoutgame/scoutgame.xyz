import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { maxRecords, getWalletTransactions } from '@packages/blockchain/provider/taikoscan/client';
import type { SupportedChainId } from '@packages/blockchain/provider/taikoscan/request';
import { supportedChains } from '@packages/blockchain/provider/taikoscan/request';
import { toJson } from '@packages/utils/json';
import type { Address } from 'viem';

const log = getLogger('cron-retrieve-wallet-transactions');

export async function processWalletTransactions({
  chainId: _chainId,
  walletId,
  address,
  fromBlock,
  toBlock
}: {
  chainId: number;
  walletId: string;
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
}) {
  const chainId = _chainId as SupportedChainId;
  if (!supportedChains[chainId]) {
    log.error('Chain id', chainId, 'not supported by Taikoscan');
    return;
  }

  const allTransactions: Awaited<ReturnType<typeof getWalletTransactions>> = [];
  let currentPage = 1;

  while (true) {
    try {
      const pollStart = Date.now();
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
        await Promise.all([
          prisma.scoutProjectWalletTransaction.createMany({
            data: result.map((transaction) => ({
              walletId,
              chainId,
              blockNumber: Number(transaction.blockNumber),
              txHash: transaction.hash,
              txData: JSON.parse(toJson(transaction) || '{}'),
              gasUsed: Number(transaction.gasUsed),
              gasPrice: Number(transaction.gasPrice),
              gasCost: Number(transaction.gasUsed) * Number(transaction.gasPrice),
              from: transaction.from.toLowerCase(),
              to: transaction.to ? transaction.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
              createdAt: new Date(Number(transaction.timeStamp) * 1000),
              status: transaction.txreceipt_status
            }))
          }),
          // Record this poll event
          prisma.scoutProjectWalletPollEvent.create({
            data: {
              walletId,
              fromBlockNumber: fromBlock,
              toBlockNumber: toBlock,
              processedAt: new Date(),
              processTime: Date.now() - pollStart
            }
          })
        ]);
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
}
