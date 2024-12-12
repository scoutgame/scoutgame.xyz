'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';
import { mergeUserAccount } from 'lib/users/mergeUserAccount';

import { mergeUserFarcasterAccountSchema } from './mergeUserFarcasterAccountSchema';

export const mergeUserFarcasterAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_farcaster_account'
  })
  .schema(mergeUserFarcasterAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    const { authData, selectedProfile } = parsedInput;

    const { fid } = await verifyFarcasterUser({
      message: authData.message,
      signature: authData.signature as `0x${string}`,
      nonce: authData.nonce
    });

    await mergeUserAccount({
      userId: scoutId,
      farcasterId: fid,
      selectedProfile
    });
  });
