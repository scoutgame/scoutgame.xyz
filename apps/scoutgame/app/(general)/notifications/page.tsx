import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwait, safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getAppNotificationCount, getAppNotifications } from '@packages/scoutgame/notifications/getAppNotifications';
import { NotificationsPage } from '@packages/scoutgame-ui/components/notifications/NotificationsPage';

export default async function NotificationsPageContainer({
  searchParams
}: {
  searchParams: { status: 'read' | 'unread' | 'all' };
}) {
  const session = await getSession();
  const userId = session.scoutId;

  if (!userId) {
    return null;
  }

  const status = searchParams.status ?? 'all';

  const [error, data] = await safeAwaitSSRData(
    Promise.all([getAppNotifications({ userId, status }), getAppNotificationCount({ userId })])
  );

  if (error) {
    return null;
  }

  const [notifications, notificationCount] = data;

  return <NotificationsPage notifications={notifications} status={status} notificationCount={notificationCount} />;
}
