import type { NotificationType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export interface MarkTask {
  id: string;
  type: NotificationType;
}

export async function markTasks(tasks: MarkTask[], userId: string) {
  const taskIds = tasks.map((userNotification) => userNotification.id);
  const sentNotifications = await prisma.userNotification.findMany({
    where: {
      taskId: {
        in: taskIds
      },
      userId
    },
    select: {
      taskId: true
    }
  });

  const tasksNotNotified = tasks.filter((task) => !sentNotifications.some((t) => t.taskId === task.id));

  if (tasksNotNotified.length !== 0) {
    await prisma.userNotification.createMany({
      data: tasksNotNotified.map((task) => ({
        taskId: task.id,
        channel: 'webapp' as const,
        type: task.type,
        userId,
        createdAt: new Date()
      }))
    });
  }
}
