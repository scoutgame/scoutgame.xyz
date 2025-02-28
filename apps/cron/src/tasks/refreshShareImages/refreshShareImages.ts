import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { refreshShareImage } from '@packages/scoutgame/builders/refreshShareImage';

export async function refreshShareImages() {
  const builderNfts = await prisma.builderNft.findMany({
    where: {
      season: getCurrentSeasonStart()
    }
  });

  for (const builderNft of builderNfts) {
    if (builderNft?.tokenId) {
      await refreshShareImage(builderNft).catch((error) => {
        log.error(`Error refreshing share image for NFT`, {
          error,
          userId: builderNft.builderId
        });
        return null;
      });

      // log.info(
      //   `Builder congrats metadata image was created with the link:${updatedBuilderNft?.congratsImageUrl} for ${
      //     updatedBuilderNft?.id
      //   }`
      // );
    }
  }
}
