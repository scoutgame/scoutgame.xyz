import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { savePendingTransaction } from '../savePendingTransaction';

import { optimismUsdcContractAddress, realOptimismMainnetBuildersContract } from './constants';
import { getOnchainPurchaseEvents } from './getOnchainPurchaseEvents';
import { getTokenPurchasePrice } from './getTokenPurchasePrice';
import { handlePendingTransaction } from './handlePendingTransaction';

export async function syncUserNFTsFromOnchainData({
  username,
  scoutId,
  fromBlock
}: {
  username?: string;
  scoutId?: string;
  fromBlock?: number;
}): Promise<void> {
  if (!username && !scoutId) {
    throw new Error('Either username or scoutId must be provided');
  } else if (username && scoutId) {
    throw new Error('Only one of username or scoutId can be provided');
  }

  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      id: scoutId,
      username
    }
  });

  const userPurchases = await getOnchainPurchaseEvents({ scoutId: scout.id, fromBlock });

  const txRequiringReconciliation = userPurchases.filter((p) => !p.nftPurchase);

  for (let i = 0; i < txRequiringReconciliation.length; i++) {
    const txToReconcile = txRequiringReconciliation[i];

    log.error(`Processing missing txToReconcile ${i + 1} / ${txRequiringReconciliation.length}`, {
      sourceTransaction: txToReconcile.pendingTransaction?.sourceChainTxHash,
      sourceChain: txToReconcile.pendingTransaction?.sourceChainId,
      optimismTxHash: txToReconcile.txHash,
      tokenId: txToReconcile.tokenId,
      scoutId: txToReconcile.scoutId,
      tokensToPurchase: txToReconcile.amount
    });
    const expectedPrice =
      txToReconcile.pendingTransaction?.targetAmountReceived ??
      (await getTokenPurchasePrice({
        args: {
          amount: BigInt(txToReconcile.amount),
          tokenId: BigInt(txToReconcile.tokenId)
        },
        blockNumber: BigInt(txToReconcile.blockNumber) - BigInt(1)
      }));

    if (!txToReconcile.pendingTransaction) {
      log.error('No pending transaction found for txToReconcile', {
        scoutId: txToReconcile.scoutId,
        tokenId: txToReconcile.tokenId,
        tokensToPurchase: txToReconcile.amount
      });
    }
    const pendingTx =
      txToReconcile.pendingTransaction ??
      (await savePendingTransaction({
        user: {
          scoutId: scout.id,
          walletAddress: txToReconcile.transferEvent.to
        },
        transactionInfo: {
          destinationChainId: 10,
          sourceChainId: 10,
          sourceChainTxHash: txToReconcile.txHash
        },
        purchaseInfo: {
          quotedPriceCurrency: optimismUsdcContractAddress,
          builderContractAddress: realOptimismMainnetBuildersContract,
          tokenId: parseInt(txToReconcile.tokenId),
          quotedPrice: Number(expectedPrice.toString()),
          tokenAmount: Number(txToReconcile.amount)
        }
      }));

    await handlePendingTransaction({ pendingTransactionId: pendingTx.id });
  }
}
