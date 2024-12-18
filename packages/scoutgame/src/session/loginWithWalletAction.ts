'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authSecret } from '@packages/utils/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

import { actionClient } from '../actions/actionClient';
import { getUserFromSession } from '../session/getUserFromSession';
import { type SessionUser } from '../session/interfaces';
import { findOrCreateWalletUser } from '../users/findOrCreateWalletUser';
import { connectWalletAccountSchema } from '../wallets/connectWalletAccountSchema';
import { verifyWalletSignature } from '../wallets/verifyWalletSignature';

import { saveSession } from './saveSession';

export const loginWithWalletAction = actionClient
  .metadata({ actionName: 'login_with_wallet' })
  .schema(connectWalletAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    const newUserId = ctx.session.anonymousUserId;
    const { walletAddress } = await verifyWalletSignature(parsedInput);

    if (parsedInput.inviteCode) {
      cookies().set(
        'invite-code',
        await sealData({ inviteCode: parsedInput.inviteCode }, { password: authSecret as string })
      );
      log.info(`Builder logged in with invite code: ${parsedInput.inviteCode}`, { walletAddress });
    }

    const user = await findOrCreateWalletUser({
      wallet: walletAddress,
      newUserId,
      referralCode: parsedInput.referralCode
    });
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
