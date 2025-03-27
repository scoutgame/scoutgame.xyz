import { prisma } from '@charmverse/core/prisma-client';

export async function cancelNftListing({ listingId, scoutId }: { listingId: string; scoutId: string }) {
  const listing = await prisma.developerNftListing.findUniqueOrThrow({
    where: { id: listingId, seller: { scoutId } },
    select: {
      sellerWallet: true,
      completedAt: true,
      cancelledAt: true,
      order: true
    }
  });

  if (listing.completedAt || listing.cancelledAt) {
    throw new Error('This listing is no longer active');
  }

  await prisma.developerNftListing.delete({
    where: { id: listingId }
  });
}

export async function completeNftListing({ listingId, buyerWallet }: { listingId: string; buyerWallet: string }) {
  const listing = await prisma.developerNftListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      sellerWallet: true,
      completedAt: true,
      cancelledAt: true
    }
  });

  if (listing.completedAt || listing.cancelledAt) {
    throw new Error('This listing is no longer active');
  }

  const updatedListing = await prisma.developerNftListing.update({
    where: { id: listingId },
    data: {
      completedAt: new Date(),
      buyerWallet
    }
  });

  return updatedListing;
}
