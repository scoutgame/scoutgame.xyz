import { log } from '@charmverse/core/log';
import type { IMailgunClient } from 'mailgun.js/Interfaces';

import mailgunClient, { DOMAIN } from './mailgunClient';

export interface EmailRecipient {
  email: string;
  displayName?: string | null;
  userId: string;
}

export async function sendEmailTemplate({
  client,
  to,
  subject,
  templateVariables,
  senderAddress,
  template
}: {
  client?: IMailgunClient | null;
  to: EmailRecipient;
  subject: string;
  templateVariables: Record<string, string | number>;
  senderAddress: string;
  template: string;
}) {
  const recipientAddress = to.displayName ? `${to.displayName} <${to.email}>` : to.email;
  client = client ?? mailgunClient;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId: to.userId });
  }

  return client?.messages.create(DOMAIN, {
    from: senderAddress,
    to: recipientAddress,
    subject,
    template,
    't:variables': templateVariables
  });
}
