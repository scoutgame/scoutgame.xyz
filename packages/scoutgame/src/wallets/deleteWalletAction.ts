'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { deleteWallet } from './deleteWallet';
import { deleteWalletSchema } from './deleteWalletSchema';

export const deleteWalletAction = authActionClient.schema(deleteWalletSchema).action(async ({ ctx, parsedInput }) => {
  const userId = ctx.session.scoutId;
  const address = parsedInput.address;

  await deleteWallet({ address, userId });

  revalidatePath('/accounts');

  return { success: true };
});
