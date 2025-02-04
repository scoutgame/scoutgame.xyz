'use server';

import type { DecentTxFailedPermanently } from '@packages/blockchain/waitForDecentTransactionSettlement';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handleEmailFailedTransaction } from './handleEmailFailedTransaction';
import { handlePendingTransaction } from './handlePendingTransaction';

export const checkDecentTransactionAction = authActionClient
  .metadata({ actionName: 'handle-mint-nft' })
  .schema(
    yup.object().shape({
      pendingTransactionId: yup.string().required(),
      txHash: yup.string()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    await handlePendingTransaction({
      pendingTransactionId: parsedInput.pendingTransactionId
    }).catch(async (err: Error | DecentTxFailedPermanently) => {
      await handleEmailFailedTransaction({
        userId,
        pendingTransactionId: parsedInput.pendingTransactionId,
        errorMessage: err.message || undefined
      });

      throw err;
    });

    revalidatePath('/', 'layout');

    return { success: true };
  });
