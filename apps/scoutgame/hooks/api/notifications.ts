import { useGET } from '@packages/scoutgame-ui/hooks/helpers';

export function useGetUnreadNotificationsCount() {
  return useGET<{ count: number }>('/api/notifications/unread-count');
}
