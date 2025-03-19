import type { ScoutAppNotification } from '@charmverse/core/prisma-client';
import { Container, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import Link from 'next/link';

import { NotificationCard } from './NotificationCard';

export function NotificationsPage({
  notifications,
  status,
  notificationCount
}: {
  notificationCount: {
    read: number;
    unread: number;
  };
  status: 'read' | 'unread' | 'all';
  notifications: ScoutAppNotification[];
}) {
  return (
    <Container maxWidth='md'>
      <Stack my={4} gap={2}>
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='h4' color='secondary' fontWeight={600}>
            Notifications
          </Typography>
          <Stack direction='row' gap={2}>
            <Tabs value={status}>
              <Tab
                value='all'
                label={`All (${notificationCount.read + notificationCount.unread})`}
                component={Link}
                href={{ query: { status: 'all' } }}
              />
              <Tab
                value='unread'
                label={`Unread (${notificationCount.unread})`}
                component={Link}
                href={{ query: { status: 'unread' } }}
              />
              <Tab
                value='read'
                label={`Read (${notificationCount.read})`}
                component={Link}
                href={{ query: { status: 'read' } }}
              />
            </Tabs>
          </Stack>
        </Stack>
        <Divider />
        <Stack gap={2}>
          {notifications.length > 0 ? (
            notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
          ) : (
            <Typography>No notifications received yet</Typography>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
