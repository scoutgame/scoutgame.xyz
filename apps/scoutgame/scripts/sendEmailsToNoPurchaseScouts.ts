import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { getCurrentSeasonStart } from '@packages/scoutgame/dates/utils';

export async function sendEmailsToNoPurchaseScouts() {
  const nonPurchasingScouts = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      },
      userSeasonStats: {
        some: {
          season: getCurrentSeasonStart(),
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
        to: { displayName: scout.displayName, email: scout.email!, userId: scout.id },
        subject: 'Ready to Start Your Scout Game Journey?',
        template: 'no purchased cards by user',
        templateVariables: {
          name: scout.displayName
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
      });
    } catch (error) {
      log.error(`Error sending no purchased cards email to ${scout.email}`, { error, userId: scout.id });
    }
  }
}
