'use server';

import { authSchema } from '@packages/farcaster/config';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import type { UserProfile } from '@packages/users/getUserProfile';

import { completeQuests } from '../quests/completeQuests';

import { connectFarcasterAccount } from './connectFarcasterAccount';
import { verifyFarcasterUser } from './verifyFarcasterUser';

export const connectFarcasterAccountAction = authActionClient
  .schema(authSchema)
  .action<{ connectedUser?: UserProfile; success: boolean }>(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    const userId = ctx.session.scoutId;

    const existingFarcasterUser = await connectFarcasterAccount({ fid, userId });

    await completeQuests(userId, ['link-farcaster-account']);

    return { success: true, connectedUser: existingFarcasterUser };
  });
