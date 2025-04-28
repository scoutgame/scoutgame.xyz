import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { waitForDecentV4TransactionSettlement } from '@packages/blockchain/waitForDecentV4TransactionSettlement';
import { base } from 'viem/chains';

export async function handlePendingMatchupTransaction({ userId, matchupId }: { userId: string; matchupId: string }) {
  const matchup = await prisma.scoutMatchup.findUnique({
    where: {
      id: matchupId,
      createdBy: userId
    },
    include: {
      decentRegistrationTx: true
    }
  });

  if (!matchup) {
    log.warn('Matchup not found', { matchupId });
    return;
  }

  if (matchup.decentRegistrationTx?.status !== 'pending') {
    log.info('Matchup is not pending. Skipping processing', { matchupId });
    return;
  }

  if (!matchup.decentRegistrationTx) {
    log.warn('Matchup has no decent registration tx. Skipping processing', { matchupId });
    return;
  }

  try {
    const txHash = await waitForDecentV4TransactionSettlement({
      sourceTxHash: matchup.decentRegistrationTx.hash.toLowerCase(),
      sourceTxHashChainId: matchup.decentRegistrationTx.chainId
    });

    log.info('Matchup transaction settled', { matchupId, txHash });

    await prisma.$transaction(async (tx) => {
      await tx.blockchainTransaction.update({
        where: { id: matchup.decentRegistrationTx!.id },
        data: {
          status: 'success'
        }
      });

      const finalTx = await tx.blockchainTransaction.create({
        data: {
          status: 'success',
          hash: txHash,
          chainId: base.id
        }
      });

      await tx.scoutMatchup.update({
        where: { id: matchupId },
        data: {
          registrationTxId: finalTx.id
        }
      });
    });
  } catch (error) {
    await prisma.scoutMatchup.update({
      where: { id: matchupId },
      data: {
        decentRegistrationTx: {
          update: {
            status: 'failed',
            error: { message: (error as any).message }
          }
        }
      }
    });

    log.error('Error waiting for draft offer transaction settlement', {
      matchupId,
      error
    });

    throw error;
  }
}
