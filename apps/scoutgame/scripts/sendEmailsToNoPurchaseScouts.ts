import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function sendEmailsToNoPurchaseScouts() {
  const nonPurchasingScouts = await prisma.scout.findMany({
    where: {
      userSeasonStats: {
        some: {
          season: getCurrentSeasonStart(),
          nftsPurchased: 0
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true
    }
  });

  for (const scout of nonPurchasingScouts) {
    try {
      await sendEmailNotification({
        userId: scout.id,
        notificationType: 'no_purchased_cards_by_user',
        templateVariables: {
          name: scout.displayName
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
      });
    } catch (error) {
      log.error(`Error sending no purchased cards email to ${scout.id}`, { error, userId: scout.id });
    }
  }
}
