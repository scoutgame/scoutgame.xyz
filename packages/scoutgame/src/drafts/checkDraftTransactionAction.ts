'use server';

import type { DecentTxFailedPermanently } from '@packages/blockchain/waitForDecentTransactionSettlement';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handleEmailFailedTransaction } from '../builderNfts/handleEmailFailedTransaction';
import { handlePendingTransaction } from '../builderNfts/handlePendingTransaction';

export const checkDraftTransactionAction = authActionClient
  .metadata({ actionName: 'handle-draft-transaction' })
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

    revalidatePath('/draft/register', 'layout');

    return { success: true };
  });
