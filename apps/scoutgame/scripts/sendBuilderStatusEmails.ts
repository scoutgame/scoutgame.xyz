import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';
import { currentSeason } from '@packages/scoutgame/dates';

export async function sendBuilderStatusEmails() {
  const builders = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      },
      builderStatus: {
        not: null
      },
      sendTransactionEmails: true,
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      builderNfts: {
        where: {
          season: currentSeason,
          nftType: "default"
        },
        select: {
          imageUrl: true
        }
      }
    }
  });

  for (const builder of builders) {
    try {
      await sendEmailTemplate({
        to: { displayName: builder.displayName, email: builder.email!, userId: builder.id },
        subject: 'You’re Already Making an Impact in Scout Game! 🎉',
        template: 'builder status',
        templateVariables: {
          builder_name: builder.displayName,
          builder_card_image: builder.builderNfts[0].imageUrl,
        },
        senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
      })
    } catch (error) {
      log.error(`Error sending builder status email to ${builder.email}`, { error, userId: builder.id });
    }
  }
}
