import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';

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

  const isOnchain = isOnchainPlatform();

  return {
    imageUrl: builderNft?.imageUrl as string,
    currentPrice: isOnchain ? BigInt(builderNft?.currentPriceDevToken ?? 0) : builderNft?.currentPrice || BigInt(0)
  };
}
