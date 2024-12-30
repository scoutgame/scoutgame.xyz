import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';

export async function sendGemsPayoutEmails({ week }: { week: string }) {
  const scouts = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      },
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true,
      email: true
    }
  });

  let totalEmailsSent = 0;

  for (const scout of scouts) {
    try {
      const { points: weeklyClaimablePoints } = await getClaimablePoints({ userId: scout.id, week });
      if (weeklyClaimablePoints) {
        await sendEmailTemplate({
          to: {
            displayName: scout.displayName,
            email: scout.email!,
            userId: scout.id
          },
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          subject: 'Claim Your Scout Points This Week! 🎉',
          template: 'Weekly Claim',
          templateVariables: {
            name: scout.displayName,
            points: weeklyClaimablePoints
          }
        });
        totalEmailsSent += 1;
      }
    } catch (error) {
      log.error('Error sending points claim email', { error, userId: scout.id });
    }
  }

  return totalEmailsSent;
}
