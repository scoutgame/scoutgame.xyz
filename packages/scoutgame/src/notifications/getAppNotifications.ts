import { prisma } from '@charmverse/core/prisma-client';

export async function getAppNotifications({ userId }: { userId: string }) {
  const notifications = await prisma.scoutAppNotification.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return notifications;
}
