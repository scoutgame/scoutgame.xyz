'use server';

import { authSchema } from '@packages/farcaster/config';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import type { UserAccountMetadata } from 'lib/users/getUserProfile';

import { connectFarcasterAccount } from './connectFarcasterAccount';
import { verifyFarcasterUser } from './verifyFarcasterUser';

export const connectFarcasterAccountAction = authActionClient
  .schema(authSchema)
  .action<{ connectedUser?: UserAccountMetadata; success: boolean }>(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    const userId = ctx.session.scoutId;

    const existingFarcasterUser = await connectFarcasterAccount({ fid, userId });

    return { success: true, connectedUser: existingFarcasterUser };
  });
