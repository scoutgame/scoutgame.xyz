import { prisma } from '@charmverse/core/prisma-client';

import { updateCurrentNftListingPrice } from './updateCurrentNftListingPrice';

export async function cancelNftListing({ listingId, scoutId }: { listingId: string; scoutId: string }) {
  const listing = await prisma.developerNftListing.findUniqueOrThrow({
    where: { id: listingId, seller: { scoutId } },
    select: {
      sellerWallet: true,
      completedAt: true,
      order: true,
      builderNftId: true
    }
  });

  if (listing.completedAt) {
    throw new Error('This listing is no longer active');
  }

  await prisma.developerNftListing.delete({
    where: { id: listingId }
  });

  await updateCurrentNftListingPrice({ builderNftId: listing.builderNftId });
}

export async function completeNftListing({ listingId, buyerWallet }: { listingId: string; buyerWallet: string }) {
  const listing = await prisma.developerNftListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      sellerWallet: true,
      completedAt: true,
      builderNftId: true
    }
  });

  if (listing.completedAt) {
    throw new Error('This listing is no longer active');
  }

  const updatedListing = await prisma.developerNftListing.update({
    where: { id: listingId },
    data: {
      completedAt: new Date(),
      buyerWallet
    }
  });

  await updateCurrentNftListingPrice({ builderNftId: listing.builderNftId });

  return updatedListing;
}
