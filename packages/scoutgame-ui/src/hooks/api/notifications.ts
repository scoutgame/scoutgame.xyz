import { useGET } from '../../hooks/helpers';

export function useGetUnreadNotificationsCount() {
  return useGET<{ count: number }>('/api/notifications/unread-count');
}
