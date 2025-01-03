import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { IMailgunClient } from 'mailgun.js/Interfaces';

import mailgunClient, { DOMAIN } from './mailgunClient';

const isTestEnv = process.env.REACT_APP_APP_ENV === 'test';

export async function sendEmailTemplate({
  client,
  subject,
  templateVariables,
  senderAddress,
  template,
  userId
}: {
  userId: string;
  client?: IMailgunClient | null;
  subject: string;
  templateVariables: Record<string, string | number>;
  senderAddress: string;
  template: string;
}) {
  client = client ?? mailgunClient;

  if (isTestEnv) {
    return;
  }

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId });
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
    log.debug('User does not have an email, not sending email');
    return;
  }

  if (!user.sendTransactionEmails) {
    log.debug('User does not want to receive any emails, not sending email');
    return;
  }

  const recipientAddress = user.displayName ? `${user.displayName} <${user.email}>` : (user.email as string);

  return client?.messages.create(DOMAIN, {
    from: senderAddress,
    to: recipientAddress,
    subject,
    template,
    't:variables': templateVariables
  });
}
