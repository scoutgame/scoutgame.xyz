import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { sendEmailTemplate } from '@packages/mailer/sendEmailTemplate';

import { registerBuilderNFT } from '../builderNfts/builderRegistration/registerBuilderNFT';
import { registerBuilderStarterPackNFT } from '../builderNfts/builderRegistration/registerBuilderStarterPackNFT';

const baseUrl = process.env.DOMAIN || 'https://scoutgame.xyz';

export async function approveBuilder({
  builderId,
  season = getCurrentSeasonStart()
}: {
  builderId: string;
  season?: Season;
}) {
  // make sure scout exists
  const scout = await prisma.scout.findUniqueOrThrow({
    where: {
      id: builderId
    },
    select: {
      id: true,
      githubUsers: true,
      displayName: true,
      path: true
    }
  });

  // Register an NFT for the builder
  const builderNft = await registerBuilderNFT({
    builderId,
    season
  });

  // register starter pack NFT as well
  await registerBuilderStarterPackNFT({
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

  log.info('Builder approved', { userId: builderId, season });

  try {
    await sendEmailTemplate({
      userId: scout.id,
      subject: 'Welcome to Scout Game, Builder! 🎉',
      template: 'Builder Approved',
      templateVariables: {
        builder_name: scout.displayName,
        builder_card_image: builderNft.imageUrl,
        builder_profile_link: `${baseUrl}/u/${scout.path}`
      },
      senderAddress: 'The Scout Game <updates@mail.scoutgame.xyz>'
    });
  } catch (error) {
    log.error('Error sending builder approval email', { error, userId: scout.id });
  }
}
