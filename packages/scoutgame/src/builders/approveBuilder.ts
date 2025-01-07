import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/mailer';

import { registerBuilderNFT } from '../builderNfts/builderRegistration/registerBuilderNFT';

const baseUrl = process.env.DOMAIN as string;

export async function approveBuilder({
  builderId,
  season = getCurrentSeasonStart()
}: {
  builderId: string;
  season?: Season;
}) {
  if (!baseUrl) {
    throw new Error('DOMAIN is not set');
  }

  // make sure scout exists
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      id: true,
      githubUsers: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          imageUrl: true
        }
      }
    }
  });

  // Register an NFT for the builder
  await registerBuilderNFT({
    builderId,
    season
  });

  // Update builder status so they appear in the system
  await prisma.scout.update({
    where: {
      id: builderId
    },
    data: {
      builderStatus: 'approved'
    }
  });

  try {
    await sendEmailTemplate({
      userId: scout.id,
      subject: 'Welcome to Scout Game, Builder! 🎉',
      template: 'Builder Approved',
      templateVariables: {
        builder_name: scout.displayName,
        builder_card_image: scout.builderNfts[0].imageUrl,
        builder_profile_link: `${baseUrl}/u/${scout.path}`
      },
      senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
    });
  } catch (error) {
    log.error('Error sending email', { error, userId: scout.id });
  }
}
