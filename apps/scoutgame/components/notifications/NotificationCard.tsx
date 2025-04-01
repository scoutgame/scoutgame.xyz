'use client';

import type { ScoutAppNotification } from '@charmverse/core/prisma-client';
import { Typography, Stack, Card, Link, Button } from '@mui/material';
import { AppNotificationTypesRecord } from '@packages/scoutgame/notifications/appNotificationConstants';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { useAction } from 'next-safe-action/hooks';

import { toggleAppNotification } from 'lib/actions/toggleAppNotification';

export function NotificationCard({ notification }: { notification: ScoutAppNotification }) {
  const { execute, isExecuting } = useAction(toggleAppNotification);
  const notificationType = notification.notificationType as keyof typeof AppNotificationTypesRecord;
  const title = AppNotificationTypesRecord[notificationType].title;

  const description = AppNotificationTypesRecord[notificationType].description(notification.templateVariables as any);
  const targetUrl = AppNotificationTypesRecord[notificationType].targetUrl(notification.templateVariables as any);

  const isDesktop = useMdScreen();

  return (
    <Card
      sx={{
        p: {
          xs: 1,
          md: 2
        },
        gap: {
          xs: 0.5,
          md: 1.5
        },
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        bgcolor: notification.read ? 'background.dark' : 'background.paper',
        transition: 'background-color 150ms ease-in-out',
        '&:hover': {
          bgcolor: 'transparent',
          textDecoration: 'none',
          transition: 'background-color 150ms ease-in-out'
        }
      }}
      component={Link}
      href={targetUrl}
      onClick={() => {
        if (notification.read || isExecuting) return;
        execute({ notificationId: notification.id, read: true });
      }}
    >
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Typography variant={isDesktop ? 'h5' : 'h6'}>{title}</Typography>
        <Typography fontWeight={600} variant={isDesktop ? 'body1' : 'body2'}>
          {getShortenedRelativeTime(notification.createdAt)}
        </Typography>
      </Stack>
      <Typography
        mb={{
          xs: 0.5,
          md: 1
        }}
        variant={isDesktop ? 'body1' : 'body2'}
      >
        {description}
      </Typography>
      <Button
        size={isDesktop ? 'medium' : 'small'}
        variant='text'
        sx={{ alignSelf: 'flex-start', width: 'fit-content', bgcolor: 'background.light' }}
        disabled={isExecuting}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isExecuting) return;
          execute({ notificationId: notification.id, read: !notification.read });
        }}
      >
        <Typography textTransform='capitalize'>Mark {notification.read ? 'unread' : 'read'}</Typography>
      </Button>
    </Card>
  );
}
