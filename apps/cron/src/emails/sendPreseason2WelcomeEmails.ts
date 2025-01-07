import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';

export async function sendPreseason2WelcomeEmails() {
  const users = await prisma.scout.findMany({
    where: {
      deletedAt: null,
      onboardedAt: {
        not: null
      }
    },
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true
    }
  });
  const totalEmails = users.length;
  let emailsSent = 0;

  for (const user of users) {
    try {
      sendEmailTemplate({
        senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
        subject: 'Preseason 2 Starts Now!',
        template: 'new season welcome',
        userId: user.id
      });
      emailsSent += 1;
    } catch (error) {
      log.error('Error sending email', { error, userId: user.id });
    }
  }

  log.info('Preseason 2 welcome emails sent', { totalEmails, emailsSent });
}
