import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function getBuilderNft(builderId: string, nftType: BuilderNftType = 'default') {
  return prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        builderId,
        season: getCurrentSeasonStart(),
        nftType
      }
    },
    select: {
      imageUrl: true,
      // TODO: use the currentPriceInScoutToken when we move to $SCOUT
      currentPrice: true
    }
  });
}
