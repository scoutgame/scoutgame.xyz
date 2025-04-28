'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handlePendingMatchupTransaction } from './handleMatchupTransaction';

export const checkMatchupTransactionAction = authActionClient
  .metadata({ actionName: 'handle-matchup-transaction' })
  .schema(
    yup.object().shape({
      matchupId: yup.string().required()
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    await handlePendingMatchupTransaction({
      userId,
      matchupId: parsedInput.matchupId
    });
    // .catch(async (error: Error) => {
    // await sendDraftTransactionFailedEmail({
    //   userId,
    //   draftOfferId: parsedInput.draftOfferId,
    //   errorMessage: error.message || undefined
    // });

    // throw error;
    // });

    revalidatePath('/matchup/register');

    return { success: true };
  });
