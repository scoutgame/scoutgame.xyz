import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { Season } from '@packages/dates/config';
import { getCurrentSeasonStart, getSeasonConfig } from '@packages/dates/utils';
import { isTestEnv } from '@packages/utils/env';

import { registerDeveloperNFT } from '../builderNfts/builderRegistration/registerDeveloperNFT';
import { registerDeveloperStarterNFT } from '../builderNfts/builderRegistration/registerDeveloperStarterNFT';
import { sendNotifications } from '../notifications/sendNotifications';

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

  const seasonConfig = getSeasonConfig(season);

  let builderNftImage: string | undefined;
  if (seasonConfig.draft && !isTestEnv) {
    log.info('Do not create NFT for developer during draft season', { userId: builderId, season });
  } else {
    // Register an NFT for the builder
    const builderNft = await registerDeveloperNFT({
      builderId,
      season
    });

    builderNftImage = builderNft?.imageUrl;

    // register starter pack NFT as well
    await registerDeveloperStarterNFT({
      builderId,
      season
    });
  }

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
    if (builderNftImage) {
      await sendNotifications({
        userId: scout.id,
        notificationType: 'builder_approved',
        email: {
          templateVariables: {
            builder_name: scout.displayName,
            builder_card_image: builderNftImage,
            builder_profile_link: `https://scoutgame.xyz/u/${scout.path}`
          }
        },
        farcaster: {
          templateVariables: undefined
        },
        app: {
          templateVariables: undefined
        }
      });
    }
  } catch (error) {
    log.error('Error sending builder approval email', { error, userId: scout.id });
  }
}
