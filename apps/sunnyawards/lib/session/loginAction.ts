'use server';

import { log } from '@charmverse/core/log';
import { loginWithFarcaster } from '@root/lib/farcaster/loginWithFarcaster';
import * as yup from 'yup';

import { actionClient } from 'lib/actions/actionClient';

const schema = yup.object({
  projectPath: yup.string().required()
});

export type FormValues = yup.InferType<typeof schema>;

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login' })
  .schema(yup.object({})) // accept all body input
  .action(async ({ ctx, parsedInput }) => {
    const loggedInUser = await loginWithFarcaster(parsedInput as any);

    log.info('User logged in with Farcaster', { userId: loggedInUser.id, method: 'farcaster' });

    ctx.session.user = { id: loggedInUser.id };
    await ctx.session.save();

    return { success: true };
  });
