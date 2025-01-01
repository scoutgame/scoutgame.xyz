import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { currentSeason } from '@packages/scoutgame/dates';

export async function sendEmailsToNoPurchaseScouts() {
  const nonPurchasingScouts = await prisma.scout.findMany({
    where: {
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
    }
  });

  for (const scout of nonPurchasingScouts) {
    try {
      await sendEmailTemplate({
        userId: scout.id,
        subject: 'Ready to Start Your Scout Game Journey?',
        template: 'no purchased cards by user',
        templateVariables: {
          name: scout.displayName,
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>',
      });
    } catch (error) {
      log.error(`Error sending no purchased cards email to ${scout.id}`, { error, userId: scout.id });
    }
  }
}
