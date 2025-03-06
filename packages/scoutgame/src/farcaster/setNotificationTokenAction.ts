'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

export const setNotificationTokenAction = authActionClient
  .schema(
    yup.object({
      notificationToken: yup.string().nullable()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { notificationToken } = parsedInput;
    const { scoutId } = ctx.session;

    await prisma.scout.update({
      where: { id: scoutId },
      data: {
        framesNotificationToken: notificationToken ?? null,
        sendFarcasterNotification: !!notificationToken
      }
    });

    return { success: true };
  });
