'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { prisma, TransactionStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import {
  DecentTxFailedPermanently,
  waitForDecentTransactionSettlement
} from '@packages/blockchain/waitForDecentTransactionSettlement';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { recordNftMint } from './recordNftMint';
import { validateTransferrableNftMint } from './validateTransferrableNftMint';

export async function checkDecentTransaction({
  pendingTransactionId
}: {
  pendingTransactionId: string;
}): Promise<void> {
  if (!stringUtils.isUUID(pendingTransactionId)) {
    throw new InvalidInputError(`Pending transaction id must be a valid uuid`);
  }
  // Atomically set the status to 'processing' only if it's currently 'pending'
  const updatedTx = await prisma.pendingNftTransaction.updateMany({
    where: {
      id: pendingTransactionId,
      status: 'pending'
    },
    data: {
      status: 'processing'
    }
  });

  if (updatedTx.count === 0) {
    scoutgameMintsLogger.info('Skip processing tx as it is locked', { pendingTransactionId });
    // The transaction is already being processed or completed, so exit
    return;
  }

  try {
    // Fetch the pending transaction
    const pendingTx = await prisma.pendingNftTransaction.findUniqueOrThrow({
      where: {
        id: pendingTransactionId
      }
    });

    if (pendingTx.status !== 'processing') {
      scoutgameMintsLogger.info(`Skipping processing for tx id ${pendingTx.id}`);
      return;
    }

    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        tokenId: Number(pendingTx.tokenId),
        contractAddress: {
          equals: pendingTx.contractAddress.toLowerCase(),
          mode: 'insensitive'
        }
      }
    });

    scoutgameMintsLogger.info('Waiting for transaction to settle', {
      sourceTxHash: pendingTx.sourceChainTxHash,
      sourceChainId: pendingTx.sourceChainId,
      contractAddress: pendingTx.contractAddress,
      destinationChainId: pendingTx.destinationChainId
    });
    const txHash =
      pendingTx.destinationChainId === pendingTx.sourceChainId
        ? pendingTx.sourceChainTxHash
        : await waitForDecentTransactionSettlement({
            sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
            sourceTxHashChainId: pendingTx.sourceChainId
          });

    scoutgameMintsLogger.info('Transaction settled', { txHash });

    const validatedMint = await validateTransferrableNftMint({
      chainId: pendingTx.destinationChainId,
      txHash
    });

    if (!validatedMint) {
      scoutgameMintsLogger.error(`Transaction on chain ${pendingTx.destinationChainId} failed`, {
        userId: pendingTx.userId,
        destinationChainId: pendingTx.destinationChainId,
        txHash
      });
      throw new DecentTxFailedPermanently();
    }

    // Update the pending transaction status to 'completed' and set destination details
    await prisma.pendingNftTransaction.update({
      where: {
        id: pendingTransactionId
      },
      data: {
        status: TransactionStatus.completed,
        destinationChainTxHash: txHash.toLowerCase()
      }
    });

    const tokenValue = Number(pendingTx.targetAmountReceived);

    await recordNftMint({
      builderNftId: builderNft.id,
      recipientAddress: pendingTx.senderAddress as `0x${string}`,
      scoutId: pendingTx.userId,
      amount: pendingTx.tokenAmount,
      tokenValue,
      txLogIndex: validatedMint.txLogIndex,
      txHash
    });
  } catch (error) {
    if (error instanceof DecentTxFailedPermanently) {
      // Update the pending transaction status to 'failed'
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.failed
        }
      });
      throw error; // Rethrow the error after updating the status
    } else {
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.pending
        }
      });
      throw error; // Rethrow the error after updating the status
    }
  }
}
