import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { updateCurrentNftListingPrice } from '@packages/scoutgame/nftListing/updateCurrentNftListingPrice';

async function currentNftListingPrices() {
  const nftListings = await prisma.developerNftListing.findMany({
    where: {
      builderNft: {
        season: getCurrentSeasonStart()
      }
    },
    select: {
      builderNftId: true,
      priceDevToken: true
    }
  });

  const uniqueBuilderNftIds = [...new Set(nftListings.map((listing) => listing.builderNftId))];

  for (const builderNftId of uniqueBuilderNftIds) {
    await updateCurrentNftListingPrice({ builderNftId });
  }
}

currentNftListingPrices();
