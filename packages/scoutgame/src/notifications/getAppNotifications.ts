import { prisma } from '@charmverse/core/prisma-client';

export async function getAppNotifications({ userId, status }: { userId: string; status: 'read' | 'unread' | 'all' }) {
  const notifications = await prisma.scoutAppNotification.findMany({
    where: {
      userId,
      read: status === 'read' ? true : status === 'unread' ? false : undefined
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return notifications;
}

export async function getAppNotificationCount({ userId }: { userId: string }) {
  const notifications = await prisma.scoutAppNotification.findMany({
    where: {
      userId
    },
    select: {
      read: true
    }
  });

  return {
    read: notifications.filter((notification) => notification.read).length,
    unread: notifications.filter((notification) => !notification.read).length
  };
}
