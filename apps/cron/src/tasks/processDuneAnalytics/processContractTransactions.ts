import { getLogger } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getLogs, getTransactionReceipt, getBlock } from '@packages/blockchain/provider/ankr/client';
import type { SupportedChainId } from '@packages/blockchain/provider/ankr/request';
import { supportedChains } from '@packages/blockchain/provider/ankr/request';
import { toJson } from '@packages/utils/json';
import type { Address } from 'viem';

const log = getLogger('cron-retrieve-contract-interactions');

// retrieve 900 logs at a time
const defaultPageSize = BigInt(900);

// retrieve txs using ankr
export async function processContractTransactions({
  address,
  fromBlock,
  toBlock: originalToBlock,
  contractId,
  pageSize = defaultPageSize,
  chainId: _chainId
}: {
  address: Address;
  fromBlock: bigint;
  toBlock: bigint;
  contractId: string;
  pageSize?: bigint;
  chainId: number;
}) {
  const chainId = _chainId as SupportedChainId;
  if (!supportedChains[chainId]) {
    log.error('Chain id', chainId, 'not supported by Ankr');
    return;
  }

  for (let currentBlock = fromBlock; currentBlock <= originalToBlock; currentBlock += pageSize) {
    const nextStep = currentBlock + (pageSize - BigInt(1));
    const toBlock = nextStep > originalToBlock ? originalToBlock : nextStep;
    const pollStart = Date.now();

    const logs = await getLogs({
      chainId,
      address,
      fromBlock: currentBlock,
      toBlock
    });

    const txHashes = new Set<string>(logs.map((l) => l.transactionHash));

    if (txHashes.size > 0) {
      log.info('Found', logs.length, 'logs and', txHashes.size, 'transactions...');
    }

    const transactions = await Promise.all(
      Array.from(txHashes).map(async (txHash) => {
        const receipt = await getTransactionReceipt({ chainId, txHash: txHash as `0x${string}` });
        const block = await getBlock({ chainId, blockNumber: receipt.blockNumber });
        return { block, receipt };
      })
    );
    if (transactions.length > 0) {
      await Promise.all([
        prisma.scoutProjectContractTransaction.createMany({
          data: transactions.map(({ receipt, block }) => ({
            contractId,
            blockNumber: Number(receipt.blockNumber),
            txHash: receipt.transactionHash,
            txData: JSON.parse(toJson(receipt) || '{}'),
            gasUsed: Number(receipt.gasUsed),
            gasPrice: Number(receipt.effectiveGasPrice),
            gasCost: Number(receipt.gasUsed) * Number(receipt.effectiveGasPrice),
            from: receipt.from.toLowerCase(),
            to: receipt.to ? receipt.to.toLowerCase() : '0x0000000000000000000000000000000000000000',
            createdAt: new Date(Number(block.timestamp) * 1000),
            status: receipt.status
          }))
        }),
        // prisma.scoutProjectContractLog.createMany({
        //   data: logs.map((l) => ({
        //     contractId,
        //     blockNumber: Number(l.blockNumber),
        //     txHash: l.transactionHash,
        //     from: l.address.toLowerCase(),
        //     logIndex: Number(l.logIndex)
        //   }))
        // }),
        // Record this poll event
        prisma.scoutProjectContractPollEvent.create({
          data: {
            contractId,
            fromBlockNumber: currentBlock,
            toBlockNumber: toBlock,
            processedAt: new Date(),
            processTime: Date.now() - pollStart
          }
        })
      ]);
    }

    const progress = Number(((currentBlock - fromBlock) * BigInt(100)) / (toBlock - fromBlock));
    if (progress % 10 === 0) {
      log.debug(`Processed up to block ${toBlock} (${progress}% complete)`);
    }
  }
}
