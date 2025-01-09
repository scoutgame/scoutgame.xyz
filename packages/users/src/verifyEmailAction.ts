'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { sendVerificationEmail } from './verifyEmail';

export const sendVerificationEmailAction = authActionClient
  .metadata({ actionName: 'verify-email' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    await sendVerificationEmail({ userId });
  });
