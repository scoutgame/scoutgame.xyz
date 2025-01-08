'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { createEmailVerification } from './verifyEmail';

export const verifyEmailAction = authActionClient
  .metadata({ actionName: 'verify-email' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    await createEmailVerification({ userId });
  });
