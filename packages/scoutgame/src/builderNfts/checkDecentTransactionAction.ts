'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { getSession } from '@packages/nextjs/session/getSession';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

import { handlePendingTransaction } from './handlePendingTransaction';

export const checkDecentTransactionAction = authActionClient
  .metadata({ actionName: 'handle-mint-nft' })
  .schema(
    yup.object().shape({
      pendingTransactionId: yup.string().required(),
      txHash: yup.string()
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await getSession();
    const userId = session?.scoutId;

    if (!userId) {
      throw new Error('User not found');
    }

    await handlePendingTransaction({
      pendingTransactionId: parsedInput.pendingTransactionId
    });

    revalidatePath('/', 'layout');

    return { success: true };
  });
