'use server';

import { authSchema } from '@packages/farcaster/config';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import type { UserProfile } from '../users/getUserProfile';

import { connectFarcasterAccount } from './connectFarcasterAccount';
import { verifyFarcasterUser } from './verifyFarcasterUser';

export const connectFarcasterAccountAction = authActionClient
  .schema(authSchema)
  .action<{ connectedUser?: UserProfile; success: boolean }>(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    const userId = ctx.session.scoutId;

    const existingFarcasterUser = await connectFarcasterAccount({ fid, userId });

    return { success: true, connectedUser: existingFarcasterUser };
  });
