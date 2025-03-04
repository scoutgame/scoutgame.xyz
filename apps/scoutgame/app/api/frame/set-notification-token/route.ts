import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { getSession } from '@packages/nextjs/session/getSession';

export async function PUT(request: Request) {
  const body = await request.json();
  const { notificationToken } = body;

  if (!notificationToken) {
    return new Response('notificationToken is required', { status: 400 });
  }

  const session = await getSession();
  const scoutId = session.scoutId;

  if (!scoutId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const scout = await prisma.scout.findUniqueOrThrow({
    where: { id: scoutId },
    select: { framesNotificationToken: true }
  });

  if (!scout.framesNotificationToken) {
    trackUserAction('frame_added', {
      userId: scoutId
    });
  }

  await prisma.scout.update({
    where: { id: scoutId },
    data: { framesNotificationToken: notificationToken }
  });

  return new Response('Notification token set', { status: 200 });
}
