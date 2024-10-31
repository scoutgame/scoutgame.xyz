'use server';

import { trackUserAction } from '@packages/mixpanel/trackUserAction';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateWalletUser } from 'lib/blockchain/findOrCreateWalletUser';
import { loginWithWalletSchema } from 'lib/blockchain/schema';
import { verifyWalletSignature } from 'lib/blockchain/verifyWallet';

import type { SessionUser } from './getUserFromSession';
import { getUserFromSession } from './getUserFromSession';
import { saveSession } from './saveSession';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(loginWithWalletSchema)
  .action(async ({ ctx, parsedInput }) => {
    const newUserId = ctx.session.anonymousUserId;

    const { walletAddress } = await verifyWalletSignature(parsedInput);
    const user = await findOrCreateWalletUser({ wallet: walletAddress, newUserId });
    await saveSession(ctx, { scoutId: user.id });
    const sessionUser = (await getUserFromSession()) as SessionUser;

    if (user.isNew) {
      trackUserAction('sign_up', {
        userId: user.id
      });
    } else {
      trackUserAction('sign_in', {
        userId: user.id
      });
    }

    return {
      user: sessionUser,
      success: true,
      onboarded: !!sessionUser.onboardedAt
    };
  });
