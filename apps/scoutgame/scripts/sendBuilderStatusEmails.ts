import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailNotification } from '@packages/mailer/sendEmailNotification';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function sendBuilderStatusEmails() {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: {
        not: null
      },
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart(),
          nftType: 'default'
        },
        select: {
          imageUrl: true
        }
      }
    }
  });

  for (const builder of builders) {
    try {
      await sendEmailNotification({
        userId: builder.id,
        notificationType: 'builder_status',
        templateVariables: {
          builder_name: builder.displayName,
          builder_card_image: builder.builderNfts[0].imageUrl
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
      });
    } catch (error) {
      log.error(`Error sending builder status email to ${builder.id}`, { error, userId: builder.id });
    }
  }
}
