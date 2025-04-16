import { prisma } from '@charmverse/core/prisma-client';
import { waitForDecentTransactionSettlement } from '@packages/blockchain/waitForDecentTransactionSettlement';

import { scoutgameDraftsLogger } from '../loggers/mintsLogger';

export async function handlePendingDraftTransaction({
  userId,
  draftOfferId
}: {
  userId: string;
  draftOfferId: string;
}) {
  const draftOffer = await prisma.draftSeasonOffer.findUnique({
    where: {
      id: draftOfferId,
      makerWallet: {
        scoutId: userId
      }
    }
  });

  if (!draftOffer) {
    scoutgameDraftsLogger.warn('Draft offer not found', { draftOfferId });
    return;
  }

  if (draftOffer.status !== 'pending') {
    scoutgameDraftsLogger.info('Draft offer is not pending. Skipping processing', { draftOfferId });
    return;
  }

  if (!draftOffer.txHash) {
    scoutgameDraftsLogger.warn('Draft offer has no tx hash. Skipping processing', { draftOfferId });
    return;
  }

  try {
    const txHash = await waitForDecentTransactionSettlement({
      sourceTxHash: draftOffer.txHash.toLowerCase(),
      sourceTxHashChainId: draftOffer.chainId
    });

    scoutgameDraftsLogger.info('Draft offer transaction settled', { draftOfferId, txHash });

    await prisma.draftSeasonOffer.update({
      where: { id: draftOfferId },
      data: {
        status: 'success',
        txHash
      }
    });
  } catch (error) {
    await prisma.draftSeasonOffer.update({
      where: { id: draftOfferId },
      data: {
        status: 'failed'
      }
    });

    scoutgameDraftsLogger.error('Error waiting for draft offer transaction settlement', {
      draftOfferId,
      error
    });

    throw error;
  }
}
