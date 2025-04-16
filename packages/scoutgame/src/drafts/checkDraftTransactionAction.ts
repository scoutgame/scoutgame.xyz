'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handlePendingDraftTransaction } from '../builderNfts/handlePendingDraftTransaction';

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
    });

    revalidatePath('/draft/register', 'layout');

    return { success: true };
  });
