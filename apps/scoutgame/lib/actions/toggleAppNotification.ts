'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { revalidatePath } from 'next/cache';
import * as yup from 'yup';

export const toggleAppNotification = authActionClient
  .metadata({ actionName: 'toggle_app_notification' })
  .schema(
    yup.object({
      notificationId: yup.string().required(),
      read: yup.boolean().optional()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.scoutId;
    const { notificationId } = parsedInput;

    const notification = await prisma.scoutAppNotification.findUnique({
      where: { id: notificationId, userId },
      select: { read: true }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const read = parsedInput.read ?? !notification.read;

    await prisma.scoutAppNotification.update({
      where: { id: notificationId },
      data: { read }
    });

    revalidatePath('/notifications');

    return { success: true };
  });
