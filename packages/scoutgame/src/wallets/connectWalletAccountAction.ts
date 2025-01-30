'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';

import { connectWalletAccount } from './connectWalletAccount';
import { connectWalletAccountSchema } from './connectWalletAccountSchema';
import { verifyWalletSignature } from './verifyWalletSignature';

export const connectWalletAccountAction = authActionClient
  .schema(connectWalletAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { walletAddress } = await verifyWalletSignature(parsedInput);
    const userId = ctx.session.scoutId;

    const existingWalletUser = await connectWalletAccount({ address: walletAddress, userId });

    revalidatePath('/accounts');

    return { success: true, connectedUser: existingWalletUser };
  });
