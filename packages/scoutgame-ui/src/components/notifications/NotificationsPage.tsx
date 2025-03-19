import type { ScoutAppNotification } from '@charmverse/core/prisma-client';
import { Container, Typography, Stack, Divider } from '@mui/material';

import { NotificationCard } from './NotificationCard';

export function NotificationsPage({ notifications }: { notifications: ScoutAppNotification[] }) {
  return (
    <Container maxWidth='md'>
      <Stack my={4} gap={2}>
        <Typography variant='h4' color='secondary' fontWeight={600}>
          Notifications
        </Typography>
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
