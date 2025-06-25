import { prisma } from '@charmverse/core/prisma-client';

export async function updateCurrentNftListingPrice({ builderNftId }: { builderNftId: string }) {
  const builderNft = await prisma.builderNft.findUniqueOrThrow({
    where: {
      id: builderNftId
    },
    select: {
      currentPrice: true,
      listings: {
        where: {
          completedAt: null // Only consider active listings
        },
        select: {
          priceDevToken: true
        }
      }
    }
  });

  // Convert all valid prices to BigInt and find the minimum
  const listingPrices = builderNft.listings
    .map((listing) => listing.priceDevToken)
    .filter((price): price is string => price !== null)
    .map((price) => BigInt(price));

  // Include current price if it exists
  if (builderNft.currentPrice) {
    listingPrices.push(builderNft.currentPrice);
  }

  // Find the minimum price, or null if no prices exist
  const lowestListingPrice =
    listingPrices.length > 0 ? listingPrices.reduce((min, price) => (price < min ? price : min)) : null;

  await prisma.builderNft.update({
    where: {
      id: builderNftId
    },
    data: {
      currentPrice: lowestListingPrice
    }
  });
}
