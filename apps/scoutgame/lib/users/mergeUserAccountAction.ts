'use server';

import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { mergeUserAccount } from './mergeUserAccount';
import { mergeUserAccountSchema } from './mergeUserAccountSchema';

export const mergeUserAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_account'
  })
  .schema(mergeUserAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    const { farcasterId, signature, nonce, message } = parsedInput;

    if (farcasterId) {
      const { fid } = await verifyFarcasterUser({
        message,
        signature: signature as `0x${string}`,
        nonce
      });

      if (farcasterId !== fid) {
        throw new Error('Farcaster ID does not match');
      }
    }

    await mergeUserAccount({
      userId: scoutId,
      farcasterId: parsedInput.farcasterId,
      telegramId: parsedInput.telegramId
    });

    return {
      success: true
    };
  });
