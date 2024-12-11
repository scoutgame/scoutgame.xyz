'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { mergeUserFarcasterAccount } from './mergeUserFarcasterAccount';
import { mergeUserFarcasterAccountSchema } from './mergeUserFarcasterAccountSchema';

export const mergeUserFarcasterAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_farcaster_account'
  })
  .schema(mergeUserFarcasterAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    const { signature, nonce, message, profileToKeep } = parsedInput;

    const { fid } = await verifyFarcasterUser({
      message,
      signature: signature as `0x${string}`,
      nonce
    });

    await mergeUserFarcasterAccount({
      userId: scoutId,
      farcasterId: fid,
      profileToKeep: profileToKeep as 'current' | 'farcaster'
    });

    return {
      success: true
    };
  });
