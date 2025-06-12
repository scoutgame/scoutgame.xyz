import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';

// Types for the different event payloads
type FrameNotificationDetails = {
  url: string;
  token: string;
};

type EventFrameAddedPayload = {
  event: 'frame_added';
  notificationDetails?: FrameNotificationDetails;
};

type EventFrameRemovedPayload = {
  event: 'frame_removed';
};

type EventNotificationsEnabledPayload = {
  event: 'notifications_enabled';
  notificationDetails: FrameNotificationDetails;
};

type EventNotificationsDisabledPayload = {
  event: 'notifications_disabled';
};

type WebhookPayload =
  | EventFrameAddedPayload
  | EventFrameRemovedPayload
  | EventNotificationsEnabledPayload
  | EventNotificationsDisabledPayload;

type FarcasterHeader = {
  fid: number;
  type: 'app_key';
  key: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Decode header and payload from base64url
    const headerJson = Buffer.from(body.header.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    const payloadJson = Buffer.from(body.payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

    const header = JSON.parse(headerJson) as FarcasterHeader;
    const payload = JSON.parse(payloadJson) as WebhookPayload;

    log.info('Farcaster webhook received', {
      fid: header.fid,
      event: payload.event,
      payload
    });

    const scout = await prisma.scout.findUnique({
      where: {
        farcasterId: header.fid
      }
    });

    if (!scout) {
      log.info('Scout not found', { fid: header.fid });
      return new Response('OK');
    }

    if (payload.event === 'notifications_enabled') {
      await prisma.scout.update({
        where: {
          id: scout.id
        },
        data: {
          sendFarcasterNotification: true,
          framesNotificationToken: payload.notificationDetails.token
        }
      });
    }

    if (payload.event === 'notifications_disabled') {
      await prisma.scout.update({
        where: {
          id: scout.id
        },
        data: {
          sendFarcasterNotification: false,
          framesNotificationToken: null
        }
      });
    }

    if (payload.event === 'frame_added') {
      trackUserAction('frame_added', {
        userId: scout.id
      });

      if (payload.notificationDetails) {
        await prisma.scout.update({
          where: {
            id: scout.id
          },
          data: {
            framesNotificationToken: payload.notificationDetails?.token,
            sendFarcasterNotification: true
          }
        });
      }
    }

    if (payload.event === 'frame_removed') {
      await prisma.scout.update({
        where: {
          id: scout.id
        },
        data: {
          sendFarcasterNotification: false
        }
      });
      trackUserAction('frame_removed', {
        userId: scout.id
      });
    }

    return new Response('OK');
  } catch (error) {
    log.error('Error processing Farcaster webhook', { error });
    return new Response('Error processing webhook', { status: 400 });
  }
}
