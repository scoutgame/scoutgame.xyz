import { getSession } from '@packages/nextjs/session/getSession';
import { safeAwait, safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getAppNotifications } from '@packages/scoutgame/notifications/getAppNotifications';
import { NotificationsPage } from '@packages/scoutgame-ui/components/notifications/NotificationsPage';

export default async function NotificationsPageContainer() {
  const session = await getSession();
  const userId = session.scoutId;

  if (!userId) {
    return null;
  }

  const [error, notifications] = await safeAwaitSSRData(getAppNotifications({ userId }));

  if (error) {
    return null;
  }

  return <NotificationsPage notifications={notifications} />;
}
