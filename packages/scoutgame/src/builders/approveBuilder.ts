import { prisma } from '@charmverse/core/prisma-client';
import { sendEmailTemplate } from '@packages/mailer/mailer';

import { registerBuilderNFT } from '../builderNfts/builderRegistration/registerBuilderNFT';
import type { Season } from '../dates';
import { currentSeason } from '../dates';

const baseUrl = process.env.DOMAIN as string;

export async function approveBuilder({ builderId, season = currentSeason }: { builderId: string; season?: Season }) {
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
      email: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season: currentSeason
        },
        select: {
          imageUrl: true
        }
      }
    }
  });

  // Register an NFT for the builder
  await registerBuilderNFT({
    imageHostingBaseUrl: baseUrl,
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

  if (scout.email) {
    await sendEmailTemplate({
      to: { email: scout.email, userId: scout.id },
      subject: 'Welcome to Scout Game, Builder! 🎉',
      template: 'Builder Approved',
      templateVariables: {
        builder_name: scout.displayName,
        builder_card_image: scout.builderNfts[0].imageUrl,
        builder_profile_link: `https://scoutgame.xyz/u/${scout.path}`
      },
      senderAddress: 'Scout Game <support@scoutgame.xyz>'
    });
  }
}
