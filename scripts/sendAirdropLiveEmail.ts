import { prisma } from '@charmverse/core/prisma-client';
import mailgunClient, { DOMAIN } from '@packages/mailer/mailgunClient';

export async function sendAirdropLiveEmail() {
  const users = await prisma.scout.findMany({
    where: {
      email: { not: null },
      deletedAt: null
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
      await mailgunClient?.messages.create(DOMAIN, {
        from: 'The Scout Game <noreply@mail.scoutgame.xyz>',
        to: user.email!,
        subject: 'Get Ready for Scout Game Season 1!',
        template: 'airdrop_live',
        't:variables': {
          name: user.displayName,
        },
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
