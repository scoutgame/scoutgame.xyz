import { log } from '@charmverse/core/log';
import { htmlToText } from 'html-to-text';

import { getInviteToPageEmail } from './emails';
import type { InviteToPageProps } from './emails/templates/InviteToPage';
import client, { SENDER_ADDRESS, DOMAIN } from './mailgunClient';

export interface EmailRecipient {
  email: string;
  displayName?: string | null;
  userId?: string;
}

interface EmailProps {
  html: string;
  subject: string;
  to: EmailRecipient;
  attachment?: { data: Buffer; name: string };
}

export async function sendEmail({ html, subject, to, attachment }: EmailProps) {
  const recipientAddress = to.displayName ? `${to.displayName} <${to.email}>` : to.email;

  if (!client) {
    log.debug('No mailgun client, not sending email');
  } else {
    log.debug('Sending email to Mailgun', { subject, userId: to.userId });
  }

  return client?.messages.create(DOMAIN, {
    from: SENDER_ADDRESS,
    to: [recipientAddress],
    // bcc: ['matt.casey@charmverse.io'],
    subject,
    text: htmlToText(html),
    html,
    attachment: attachment ? { data: attachment.data, filename: attachment.name } : undefined
  });
}

export function sendInviteToPageEmail({ to, ...variables }: { to: EmailRecipient } & InviteToPageProps) {
  const template = getInviteToPageEmail(variables);
  return sendEmail({ ...template, to });
}
