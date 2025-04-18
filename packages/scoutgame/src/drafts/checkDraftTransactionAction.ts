'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handlePendingDraftTransaction } from '../builderNfts/handlePendingDraftTransaction';
import { sendDraftTransactionFailedEmail } from '../builderNfts/sendDraftTransactionFailedEmail';

export const checkDraftTransactionAction = authActionClient
  .metadata({ actionName: 'handle-draft-transaction' })
  .schema(
    yup.object().shape({
      draftOfferId: yup.string().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    await handlePendingDraftTransaction({
      userId,
      draftOfferId: parsedInput.draftOfferId
    }).catch(async (error: Error) => {
      await sendDraftTransactionFailedEmail({
        userId,
        draftOfferId: parsedInput.draftOfferId,
        errorMessage: error.message || undefined
      });

      throw error;
    });

    revalidatePath('/draft/register');

    return { success: true };
  });
