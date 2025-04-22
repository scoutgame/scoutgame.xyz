import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

export async function getBuilderNft(builderId: string, nftType: BuilderNftType = 'default') {
  const builderNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        builderId,
        season: getCurrentSeasonStart(),
        nftType
      }
    },
    select: {
      imageUrl: true,
      currentPrice: true,
      currentPriceDevToken: true
    }
  });

  return {
    imageUrl: builderNft?.imageUrl as string,
    currentPrice: BigInt(builderNft?.currentPriceDevToken ?? 0)
  };
}
