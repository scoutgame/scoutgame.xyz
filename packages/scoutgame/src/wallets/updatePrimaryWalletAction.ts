'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { updatePrimaryWallet } from './updatePrimaryWallet';
import { updatePrimaryWalletSchema } from './updatePrimaryWalletSchema';

export const updatePrimaryWalletAction = authActionClient
  .schema(updatePrimaryWalletSchema)
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.scoutId;
    const address = parsedInput.address;

    await updatePrimaryWallet(address, userId);

    revalidatePath('/accounts');

    return { success: true };
  });
