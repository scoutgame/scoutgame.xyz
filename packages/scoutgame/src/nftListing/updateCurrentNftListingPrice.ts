import { prisma } from '@charmverse/core/prisma-client';
import { formatUnits } from 'viem';

import { devTokenDecimals } from '../protocol/constants';

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

  if (builderNft.listings.length === 0 || !builderNft.currentPrice) {
    return;
  }

  // Convert all valid prices to BigInt and find the minimum
  const listingPrices = builderNft.listings
    .map((listing) => listing.priceDevToken)
    .filter((price): price is string => price !== null)
    .map((price) => BigInt(price));

  // Find the minimum price, or null if no prices exist
  const lowestListingPrice = listingPrices.reduce((min, price) => (price < min ? price : min));

  const currentPriceRaw = builderNft.currentPrice * 10n ** BigInt(devTokenDecimals);

  await prisma.builderNft.update({
    where: {
      id: builderNftId
    },
    data: {
      currentListingPrice:
        lowestListingPrice <= currentPriceRaw ? BigInt(formatUnits(lowestListingPrice, devTokenDecimals)) : null
    }
  });
}
