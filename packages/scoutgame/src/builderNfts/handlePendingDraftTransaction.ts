import { prisma } from '@charmverse/core/prisma-client';
import { waitForDecentV4TransactionSettlement } from '@packages/blockchain/waitForDecentV4TransactionSettlement';
import { base } from 'viem/chains';

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

  if (!draftOffer.sourceChainId) {
    scoutgameDraftsLogger.warn('Draft offer has no source chain id. Skipping processing', { draftOfferId });
    return;
  }

  if (!draftOffer.decentTxHash) {
    scoutgameDraftsLogger.warn('Draft offer has no tx hash. Skipping processing', { draftOfferId });
    return;
  }

  try {
    const txHash = await waitForDecentV4TransactionSettlement({
      sourceTxHash: draftOffer.decentTxHash.toLowerCase(),
      sourceTxHashChainId: draftOffer.sourceChainId
    });

    scoutgameDraftsLogger.info('Draft offer transaction settled', { draftOfferId, txHash });

    await prisma.draftSeasonOffer.update({
      where: { id: draftOfferId },
      data: {
        status: 'success',
        txHash,
        chainId: base.id
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
