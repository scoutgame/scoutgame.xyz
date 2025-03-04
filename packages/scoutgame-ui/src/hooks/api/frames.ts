import { usePUT } from '../helpers';

export function useSetNotificationToken() {
  return usePUT<{ notificationToken: string }>('/api/frame/set-notification-token');
}
