import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';

export async function sendGemsPayoutEmails({ week }: { week: string }) {
  const scouts = await prisma.scout.findMany({
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true
    }
  });

  let totalEmailsSent = 0;

  for (const scout of scouts) {
    try {
      const { points: weeklyClaimablePoints } = await getClaimablePoints({ userId: scout.id, week });
      if (weeklyClaimablePoints) {
        await sendEmailTemplate({
          userId: scout.id,
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          subject: 'Claim Your Scout Points This Week! 🎉',
          templateType: 'weekly_claim',
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
