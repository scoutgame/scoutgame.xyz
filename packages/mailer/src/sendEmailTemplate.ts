import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { IMailgunClient } from 'mailgun.js/Interfaces';

import mailgunClient, { DOMAIN } from './mailgunClient';

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

const TemplateTypesRecord = {
  weekly_claim: 'Weekly Claim',
  builder_suspended: 'Builder suspended',
  builder_status: 'Builder status',
  no_purchased_cards_by_user: 'No purchased cards by user',
  nft_transaction_failed: 'NFT transaction failed',
  builder_card_scouted: 'Builder card scouted',
  builder_approved: 'Builder approved',
  email_verification: 'Email verification',
  referral_link_signup: 'Referral link signup',
  merged_pr_gems: 'Merged PR gems',
  partner_reward_payout: 'Partner reward payout',
  added_to_project: 'Added to project'
};

export async function sendEmailTemplate({
  client,
  subject,
  templateVariables,
  senderAddress,
  templateType,
  userId,
  overrideUserSendingPreference
}: {
  userId: string;
  client?: IMailgunClient | null;
  subject: string;
  templateVariables?: Record<string, string | number>;
  senderAddress: string;
  templateType: keyof typeof TemplateTypesRecord;
  // send email even if user has opted out of emails
  overrideUserSendingPreference?: boolean;
}) {
  client = client ?? mailgunClient;

  if (isTestEnv) {
    return;
  }

  if (!client) {
    log.debug('No mailgun client, not sending email');
    return;
  }

  const template = TemplateTypesRecord[templateType];

  if (!template) {
    log.debug('Invalid template type, not sending email', { userId, templateType });
    return;
  }

  const user = await prisma.scout.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      sendMarketing: true,
      sendTransactionEmails: true,
      email: true,
      displayName: true
    }
  });

  if (!user.email) {
    log.debug('User does not have an email, not sending email', { userId, template });
    return;
  }

  if (!user.sendTransactionEmails && !overrideUserSendingPreference) {
    log.debug('User does not want to receive any emails, not sending email', { userId, template });
    return;
  }

  const recipientAddress = user.displayName ? `${user.displayName} <${user.email}>` : (user.email as string);

  log.debug('Sending email to Mailgun', { subject, userId });

  // await prisma.scoutNotification.create({
  //   data: {
  //     channel: 'email',
  //     notificationType: templateType,
  //     emailNotifications: {
  //       create: {
  //         email: user.email,
  //         templateVariables: templateVariables ?? {}
  //       }
  //     },
  //     sentAt: new Date(),
  //     user: {
  //       connect: {
  //         id: userId
  //       }
  //     }
  //   }
  // });

  return client?.messages.create(DOMAIN, {
    from: senderAddress,
    to: recipientAddress,
    subject,
    template,
    't:variables': templateVariables
  });
}
