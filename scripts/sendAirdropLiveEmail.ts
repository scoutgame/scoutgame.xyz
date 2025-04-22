import { prisma } from '@charmverse/core/prisma-client';
import mailgunClient, { DOMAIN } from '@packages/mailer/mailgunClient';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';

export async function sendAirdropLiveEmail() {
  const users = await prisma.scout.findMany({
    where: {
      path: 'mattcasey',
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
    orderBy: {
      id: 'asc',
    },
  });

  const totalUsers = users.length;
  let totalSent = 0;

  for (const user of users) {
    try {
      await sendEmailNotification({
        templateVariables: {
          name: user.displayName,
        },
        notificationType: 'airdrop_live',
        senderAddress: 'The Scout Game <noreply@mail.scoutgame.xyz>',
        userId: user.id,
      });

      totalSent++;

      if (totalSent % 10 === 0) {
        console.log(`Sent ${totalSent}/${totalUsers} emails`);
      }
    } catch (error) {
      console.error(`Error sending email to ${user.email}:`, error);
    }
  }
}

sendAirdropLiveEmail();