import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';

export async function sendAirdropLiveEmail() {
  const users = await prisma.scout.findMany({
    where: {
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
        overrideUserSendingPreference: true,
        notificationType: 'airdrop_live',
        senderAddress: 'The Scout Game <noreply@mail.scoutgame.xyz>',
        userId: user.id,
      });

      totalSent++;

      if (totalSent % 10 === 0) {
        console.log(`Sent ${totalSent}/${totalUsers} emails`);
      }
    } catch (error) {
      console.error(`Error sending email to user ID ${user.id} (${user.email}):`, error);
    }
  }

  console.log(`Completed sending ${totalSent}/${totalUsers} emails`);
}

sendAirdropLiveEmail();