import { prisma } from '@charmverse/core/prisma-client';
import { uploadStarterPackArtwork } from '@packages/scoutgame/builderNfts/artwork/uploadStarterPackArtwork';

import { starterPackBuilders } from '@packages/scoutgame/builderNfts/builderRegistration/starterPack/starterPackBuilders';
import { getCurrentSeasonStart } from '@packages/scoutgame/dates/utils';

async function fixStarterPackArtwork() {
  const season = getCurrentSeasonStart();
  const builders = await prisma.scout.findMany({
    where: {
      farcasterId: { in: starterPackBuilders.map((b) => b.fid) }
    },
    take: 1,
    select: {
      avatar: true,
      id: true,
      displayName: true,
      path: true,
      builderNfts: {
        where: {
          season
        }
      }
    },
  });

  for (const builder of builders) {
    try {
      const fileUrl = await uploadStarterPackArtwork({
        displayName: builder.displayName,
        season,
        avatar: builder.avatar as string,
        tokenId: builder.builderNfts[0].tokenId
      });
  
      await prisma.builderNft.update({
        where: {
          id: builder.builderNfts[0].id
        },
        data: {
          imageUrl: fileUrl
        }
      });

    } catch (error) {
      console.error(`Error fixing starter pack artwork for builder ${builder.displayName}`, error);
    }
  }
}

fixStarterPackArtwork();