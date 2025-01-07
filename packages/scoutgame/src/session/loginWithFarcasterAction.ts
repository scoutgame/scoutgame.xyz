'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { actionClient } from '@packages/scoutgame/actions/actionClient';
import { authSchema } from '@packages/scoutgame/farcaster/config';
import { verifyFarcasterUser } from '@packages/scoutgame/farcaster/verifyFarcasterUser';
import { findOrCreateFarcasterUser } from '@packages/users/findOrCreateFarcasterUser';
import { authSecret } from '@packages/utils/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

import { saveSession } from './saveSession';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);

    if (parsedInput.inviteCode) {
      cookies().set(
        'invite-code',
        await sealData({ inviteCode: parsedInput.inviteCode }, { password: authSecret as string })
      );
      log.info(`Builder logged in with invite code: ${parsedInput.inviteCode}`, { fid });
    }

    const user = await findOrCreateFarcasterUser({
      fid,
      newUserId: ctx.session.anonymousUserId,
      referralCode: parsedInput.referralCode
    });
    await saveSession(ctx, { scoutId: user.id });

    if (user.isNew) {
      trackUserAction('sign_up', {
        userId: user.id
      });
    } else {
      trackUserAction('sign_in', {
        userId: user.id
      });
    }

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
