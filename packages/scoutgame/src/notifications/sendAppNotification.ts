import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import type { AppNotificationVariables } from './appNotificationConstants';
import { AppNotificationTypesRecord } from './appNotificationConstants';

export async function sendAppNotification({
  userId,
  notificationType,
  notificationVariables
}: {
  userId: string;
  notificationType: keyof typeof AppNotificationTypesRecord;
  notificationVariables: AppNotificationVariables<keyof typeof AppNotificationTypesRecord>;
}) {
  const notification = AppNotificationTypesRecord[notificationType];

  if (!notification) {
    log.debug('Invalid notification type, not sending app notification', { userId, notificationType });
    return false;
  }

  await prisma.scoutAppNotification.create({
    data: {
      userId,
      notificationType,
      templateVariables: notificationVariables ?? {}
    }
  });
}
