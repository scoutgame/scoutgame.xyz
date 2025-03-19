'use client';

import type { ScoutAppNotification } from '@charmverse/core/prisma-client';
import { Typography, Stack, Card, Link, Button } from '@mui/material';
import { AppNotificationTypesRecord } from '@packages/scoutgame/notifications/appNotificationConstants';
import { getShortenedRelativeTime } from '@packages/utils/dates';
import { useAction } from 'next-safe-action/hooks';

import { toggleAppNotification } from '../../actions/toggleAppNotification';

export function NotificationCard({ notification }: { notification: ScoutAppNotification }) {
  const { execute, isExecuting } = useAction(toggleAppNotification);
  const notificationType = notification.notificationType as keyof typeof AppNotificationTypesRecord;
  const title = AppNotificationTypesRecord[notificationType].title;

  const description =
    typeof AppNotificationTypesRecord[notificationType].description === 'function'
      ? AppNotificationTypesRecord[notificationType].description(notification.templateVariables as any)
      : AppNotificationTypesRecord[notificationType].description;

  const targetUrl =
    typeof AppNotificationTypesRecord[notificationType].targetUrl === 'function'
      ? AppNotificationTypesRecord[notificationType].targetUrl(notification.templateVariables as any)
      : AppNotificationTypesRecord[notificationType].targetUrl;

  return (
    <Card
      sx={{
        p: 2,
        gap: 1.5,
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
      onClick={(e) => {
        execute({ notificationId: notification.id, read: true });
      }}
    >
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='h5'>{title}</Typography>
        <Typography fontWeight={600}>{getShortenedRelativeTime(notification.createdAt)}</Typography>
      </Stack>
      <Typography>{description}</Typography>
      <Button
        size='medium'
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
        <Typography>Mark as {notification.read ? 'unread' : 'read'}</Typography>
      </Button>
    </Card>
  );
}
