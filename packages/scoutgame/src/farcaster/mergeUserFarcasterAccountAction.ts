'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { mergeUserAccount } from '@packages/scoutgame/users/mergeUserAccount';

import { mergeUserFarcasterAccountSchema } from './mergeUserFarcasterAccountSchema';
import { verifyFarcasterUser } from './verifyFarcasterUser';

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

    const { retainedUserId, mergedUserId } = await mergeUserAccount({
      userId: scoutId,
      farcasterId: fid,
      selectedProfile
    });

    trackUserAction('merge_account', {
      userId: scoutId,
      mergedUserId,
      retainedUserId,
      mergedIdentity: 'farcaster'
    });

    log.info('Merged user accounts', {
      userId: scoutId,
      retainedUserId,
      mergedUserId
    });
  });