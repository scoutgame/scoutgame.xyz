import { log } from '@charmverse/core/log';
import type { FarcasterNotificationVariables } from '@packages/farcaster/sendFarcasterNotification';
import { sendFarcasterNotification } from '@packages/farcaster/sendFarcasterNotification';
import type { EmailNotificationVariables } from '@packages/mailer/sendEmailNotification';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';

import type { AppNotificationVariables } from './sendAppNotification';
import { sendAppNotification } from './sendAppNotification';

export type NotificationTypes =
  | 'weekly_claim'
  | 'zero_weekly_claim'
  | 'builder_suspended'
  | 'nft_transaction_failed'
  | 'builder_card_scouted'
  | 'builder_approved'
  | 'referral_link_signup'
  | 'merged_pr_gems'
  | 'developer_rank_change'
  | 'added_to_project';

export async function sendNotifications<T extends NotificationTypes>({
  userId,
  notificationType,
  email,
  farcaster,
  app
}: {
  userId: string;
  notificationType: T;
  email?: {
    templateVariables: EmailNotificationVariables<T>;
  };
  farcaster?: {
    templateVariables: FarcasterNotificationVariables<T>;
  };
  app?: {
    templateVariables: AppNotificationVariables<T>;
  };
}): Promise<number> {
  let notificationsSent = 0;

  if (email) {
    try {
      const sent = await sendEmailNotification({
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>',
        notificationType,
        userId,
        templateVariables: email.templateVariables
      });
      notificationsSent += sent ? 1 : 0;
    } catch (error) {
      log.error('Error sending email notification', { error, userId, notificationType });
    }
  }

  if (farcaster) {
    try {
      const sent = await sendFarcasterNotification({
        userId,
        notificationType,
        notificationVariables: farcaster.templateVariables
      });
      notificationsSent += sent ? 1 : 0;
    } catch (error) {
      log.error('Error sending farcaster notification', { error, userId, notificationType });
    }
  }

  if (app) {
    try {
      await sendAppNotification({
        userId,
        notificationType,
        notificationVariables: app.templateVariables
      });
      notificationsSent += 1;
    } catch (error) {
      log.error('Error sending app notification', { error, userId, notificationType });
    }
  }

  return notificationsSent;
}
