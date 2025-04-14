import { useGET } from '@packages/scoutgame-ui/hooks/helpers';

export const GET_UNREAD_NOTIFICATIONS_COUNT_KEY = '/api/notifications/unread-count';

export function useGetUnreadNotificationsCount() {
  return useGET<{ count: number }>(GET_UNREAD_NOTIFICATIONS_COUNT_KEY);
}
