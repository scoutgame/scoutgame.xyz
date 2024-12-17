'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { connectWalletAccount } from './connectWalletAccount';
import { connectWalletAccountSchema } from './connectWalletAccountSchema';
import { verifyWalletSignature } from './verifyWalletSignature';

export const connectWalletAccountAction = authActionClient
  .schema(connectWalletAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { walletAddress } = await verifyWalletSignature(parsedInput);
    const userId = ctx.session.scoutId;

    const existingWalletUser = await connectWalletAccount({ address: walletAddress, userId });

    return { success: true, connectedUser: existingWalletUser };
  });
