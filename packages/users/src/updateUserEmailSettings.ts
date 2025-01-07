'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { updateUserEmailSettingsSchema } from './updateUserEmailSettingsSchema';

export const updateUserEmailSettingsAction = authActionClient
  .metadata({ actionName: 'update-user-email-settings' })
  .schema(updateUserEmailSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;
    await prisma.scout.update({
      where: { id: userId },
      data: {
        email: parsedInput.email,
        sendTransactionEmails: parsedInput.sendTransactionEmails,
        sendMarketing: parsedInput.sendMarketing
      }
    });

    return { success: true };
  });
