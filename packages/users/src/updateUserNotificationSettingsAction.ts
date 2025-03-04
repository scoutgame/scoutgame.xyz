'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { updateUserNotificationSettingsSchema } from './updateUserNotificationSettingsSchema';

export const updateUserNotificationSettingsAction = authActionClient
  .metadata({ actionName: 'update-user-notification-settings' })
  .schema(updateUserNotificationSettingsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await prisma.scout.update({
      where: { id: ctx.session.scoutId },
      data: {
        emailNotification: parsedInput.emailNotification,
        farcasterNotification: parsedInput.farcasterNotification
      }
    });

    return { success: true };
  });
