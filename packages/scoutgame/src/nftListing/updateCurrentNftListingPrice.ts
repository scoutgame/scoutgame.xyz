import { prisma } from '@charmverse/core/prisma-client';

export async function updateCurrentNftListingPrice({ builderNftId }: { builderNftId: string }) {
  const builderNft = await prisma.builderNft.findUniqueOrThrow({
    where: {
      id: builderNftId
    },
    select: {
      currentListingPrice: true,
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

  let lowestListingPrice: bigint | null = null;

  if (builderNft.currentListingPrice) {
    lowestListingPrice = BigInt(builderNft.currentListingPrice);
  }

  // Find the lowest price among active listings
  for (const listing of builderNft.listings) {
    if (!listing.priceDevToken) continue;

    const listingPrice = BigInt(listing.priceDevToken);
    if (!lowestListingPrice || listingPrice < lowestListingPrice) {
      lowestListingPrice = listingPrice;
    }
  }

  await prisma.builderNft.update({
    where: {
      id: builderNftId
    },
    data: {
      currentListingPrice: lowestListingPrice
    }
  });
}
