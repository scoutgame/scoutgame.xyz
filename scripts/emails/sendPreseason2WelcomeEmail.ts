import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/src/mailer';

async function sendPreseason2WelcomeEmail() {
  const users = await prisma.scout.findMany({
    orderBy: {
      id: 'desc'
    },
    select: {
      id: true,
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
      emailsSent++;
    } catch (error) {
      log.error('Error sending email', { error, userId: user.id });
    }
  }

  log.info('Preseason welcome emails sent', { totalEmails, emailsSent });
}

sendPreseason2WelcomeEmail();
