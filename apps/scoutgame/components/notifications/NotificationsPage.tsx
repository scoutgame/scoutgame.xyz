import type { ScoutAppNotification } from '@charmverse/core/prisma-client';
import { Box, Container, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import Image from 'next/image';
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
        <Stack
          direction={{
            xs: 'column',
            md: 'row'
          }}
          gap={{
            xs: 1,
            md: 0
          }}
          justifyContent='space-between'
          alignItems='center'
        >
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
            <Stack
              sx={{
                width: '100%',
                px: 2.5,
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                mt: 0,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Typography variant='h6'>
                {status === 'all'
                  ? 'No notifications received yet'
                  : status === 'read'
                    ? 'No notifications have been read'
                    : 'All notifications have been read'}
              </Typography>
              <Box
                sx={{
                  width: {
                    md: '400px',
                    xs: '250px'
                  },
                  height: {
                    md: '400px',
                    xs: '250px'
                  }
                }}
              >
                <Image
                  src='/images/cat-with-binoculars.png'
                  alt='Scouts'
                  width={400}
                  height={400}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
