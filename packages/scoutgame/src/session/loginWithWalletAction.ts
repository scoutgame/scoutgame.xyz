'use server';

import { log } from '@charmverse/core/log';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { type SessionUser } from '@packages/nextjs/session/interfaces';
import { saveSession } from '@packages/nextjs/session/saveSession';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import { authSecret } from '@packages/utils/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

import { connectWalletAccountSchema } from '../wallets/connectWalletAccountSchema';
import { verifyWalletSignature } from '../wallets/verifyWalletSignature';

export const loginWithWalletAction = actionClient
  // .schema(connectWalletAccountSchema)
  .action(async ({ ctx, parsedInput }) => {
    // eslint-disable-next-line no-console
    console.log('loginWithWalletAction', ctx, parsedInput);
    // const newUserId = ctx.session.anonymousUserId;
    // const { walletAddress } = await verifyWalletSignature(parsedInput);

    // if (parsedInput.inviteCode) {
    //   const cookieStore = await cookies();
    //   cookieStore.set(
    //     'invite-code',
    //     await sealData({ inviteCode: parsedInput.inviteCode }, { password: authSecret as string })
    //   );
    //   log.info(`Builder logged in with invite code: ${parsedInput.inviteCode}`, { userId: newUserId });
    // }

    // const user = await findOrCreateWalletUser({
    //   wallet: walletAddress,
    //   newUserId,
    //   referralCode: parsedInput.referralCode,
    //   utmCampaign: parsedInput.utmCampaign
    // });
    // await saveSession(ctx, { scoutId: user.id });
    // const sessionUser = (await getUserFromSession()) as SessionUser;

    // log.info('User logged in', {
    //   userId: user.id,
    //   newUserId,
    //   referralCode: parsedInput.referralCode || undefined,
    //   utmCampaign: parsedInput.utmCampaign || undefined
    // });

    // if (user.isNew) {
    //   trackUserAction('sign_up', {
    //     userId: user.id
    //   });
    // } else {
    //   trackUserAction('sign_in', {
    //     userId: user.id
    //   });
    // }

    // return {
    //   user: sessionUser,
    //   success: true,
    //   onboarded: !!sessionUser.onboardedAt
    // };
  });
