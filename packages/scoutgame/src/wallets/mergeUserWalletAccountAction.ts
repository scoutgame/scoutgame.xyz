'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';

import { mergeUserAccount } from '../users/mergeUserAccount';

import { mergeUserWalletAccountSchema } from './mergeUserWalletAccountSchema';
import { verifyWalletSignature } from './verifyWalletSignature';

export const mergeUserWalletAccountAction = authActionClient
  .metadata({
    actionName: 'merge_user_wallet_account'
  })
  .schema(mergeUserWalletAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const scoutId = ctx.session.scoutId;
    const { authData, selectedProfile } = parsedInput;

    const { walletAddress } = await verifyWalletSignature(authData);

    const { retainedUserId, mergedUserId } = await mergeUserAccount({
      userId: scoutId,
      walletAddress,
      selectedProfile
    });

    trackUserAction('merge_account', {
      userId: scoutId,
      mergedUserId,
      retainedUserId,
      mergedIdentity: 'wallet'
    });
  });
