import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function getBuilderNft(builderId: string) {
  return prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        builderId,
        season: getCurrentSeasonStart(),
        nftType: 'default'
      }
    },
    select: {
      imageUrl: true,
      // TODO: use the currentPriceInScoutToken when we move to $SCOUT
      currentPrice: true
    }
  });
}
