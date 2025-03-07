/* eslint-disable camelcase */

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { IMailgunClient } from 'mailgun.js/Interfaces';

import mailgunClient, { DOMAIN } from './mailgunClient';

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

type Variables = {
  weekly_claim: {
    points: number;
    name: string;
    partner_rewards: string;
  };
  zero_weekly_claim: {
    name: string;
    partner_rewards: string;
    week_num: number;
    season: string;
    new_developers: string;
  };
  builder_suspended: {
    builder_name: string;
    repo_1_title: string;
    pr_1_link: string;
    pr_1_title: string;
    repo_2_title: string;
    pr_2_link: string;
    pr_2_title: string;
    repo_3_title: string;
    pr_3_link: string;
    pr_3_title: string;
  };
  builder_status: {
    builder_name: string;
    builder_card_image: string;
  };
  no_purchased_cards_by_user: {
    name: string;
  };
  nft_transaction_failed: {
    name: string;
    tx_hash: string;
    error_message: string;
    wallet_address: string;
  };
  builder_card_scouted: {
    builder_name: string;
    builder_profile_link: string;
    cards_purchased: number;
    total_purchase_cost: number;
    builder_card_image: string;
    scout_name: string;
    scout_profile_link: string;
    current_card_price: string;
  };
  builder_approved: {
    builder_name: string;
    builder_card_image: string;
    builder_profile_link: string;
  };
  email_verification: {
    verification_url: string;
  };
  referral_link_signup: {
    name: string;
    scout_name: string;
    scout_profile_link: string;
  };
  merged_pr_gems: {
    builder_name: string;
    pr_title: string;
    pr_link: string;
    gems_value: number;
    partner_rewards: string;
  };
  developer_rank_change: {
    scout_name: string;
    developers_ranks: string;
  };
  added_to_project: {
    builder_name: string;
    project_name: string;
    project_link: string;
  };
};

export const NotificationTypesRecord = {
  weekly_claim: {
    template: 'Weekly Claim',
    subject: ({ partner_rewards }: Variables['weekly_claim']) =>
      `Claim Your Scout Points ${partner_rewards ? '& Partner Rewards' : ''} This Week! 🎉`
  },
  zero_weekly_claim: {
    template: 'Zero weekly claim',
    subject: 'A New Week, A New Opportunity 🚀'
  },
  builder_suspended: {
    template: 'Builder suspended',
    subject: 'Your developer card has been suspended'
  },
  builder_status: {
    template: 'Builder status',
    subject: 'You’re Already Making an Impact in Scout Game! 🎉'
  },
  no_purchased_cards_by_user: {
    template: 'No purchased cards by user',
    subject: 'Ready to Start Your Scout Game Journey?'
  },
  nft_transaction_failed: {
    template: 'NFT transaction failed',
    subject: 'Your NFT purchase failed'
  },
  builder_card_scouted: {
    template: 'Builder card scouted',
    subject: 'Your Developer Card Was Just Scouted! 🎉'
  },
  builder_approved: {
    template: 'Builder approved',
    subject: 'Welcome to Scout Game, Developer! 🎉'
  },
  email_verification: {
    template: 'Email verification',
    subject: 'Verify your email'
  },
  referral_link_signup: {
    template: 'Referral link signup',
    subject: 'Someone Joined Scout Game Using Your Referral! 🎉'
  },
  merged_pr_gems: {
    template: 'Merged PR gems',
    subject: 'You have scored gems from a merged pull request! 🎉'
  },
  developer_rank_change: {
    template: 'Developer rank change',
    subject: 'Your developers are on the move! 🚀'
  },
  added_to_project: {
    template: 'Added to project',
    subject: 'You have been added to a project! 🎉'
  }
};

export type EmailNotificationVariables<T extends keyof typeof NotificationTypesRecord> = Variables[T];

export async function sendEmailNotification<T extends keyof typeof NotificationTypesRecord>({
  client,
  templateVariables,
  notificationType,
  userId,
  overrideUserSendingPreference,
  senderAddress
}: {
  senderAddress: string;
  userId: string;
  client?: IMailgunClient | null;
  templateVariables: Variables[T];
  notificationType: T;
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

  const template = NotificationTypesRecord[notificationType];

  if (!template) {
    log.debug('Invalid template type, not sending email', { userId, notificationType });
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

  const recipientAddress = user.displayName ? `${user.displayName} <${user.email}>` : user.email;

  const subject =
    typeof template.subject === 'function' ? template.subject(templateVariables as any) : template.subject;

  log.debug('Sending email to Mailgun', { subject, userId, notificationType });

  await prisma.scoutEmailNotification.create({
    data: {
      notificationType,
      templateVariables: templateVariables ?? {},
      email: user.email,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });

  return client?.messages.create(DOMAIN, {
    from: senderAddress,
    to: recipientAddress,
    subject,
    template: template.template,
    't:variables': templateVariables
  });
}
