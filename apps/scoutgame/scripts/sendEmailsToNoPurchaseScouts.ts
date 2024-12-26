import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { currentSeason } from '@packages/scoutgame/dates';

export async function sendEmailsToNoPurchaseScouts() {
  const nonPurchasingScouts = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      },
      userSeasonStats: {
        some: {
          season: currentSeason,
          nftsPurchased: 0
        }
      }
    },
    select: {
      id: true,
      displayName: true,
      email: true
    }
  });

  for (const scout of nonPurchasingScouts) {
    try {
      await sendEmailTemplate({
        to: { email: scout.email!, userId: scout.id },
        subject: 'Ready to Start Your Scout Game Journey?',
        template: 'no purchased cards by user',
        templateVariables: {
          name: scout.displayName,
        },
        senderAddress: 'Scout Game <support@scoutgame.xyz>',
      });
    } catch (error) {
      log.error(`Error sending email to ${scout.email}`, { error });
    }
  }
}
