import { prisma } from '@charmverse/core/prisma-client';
import type { OrderComponents } from '@opensea/seaport-js/lib/types';

import { cancelSeaportListing } from '../seaport/cancelSeaportListing';

export async function cancelNftListing({ listingId, scoutId }: { listingId: string; scoutId: string }) {
  const listing = await prisma.builderNftListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      sellerWallet: true,
      completedAt: true,
      cancelledAt: true,
      order: true
    }
  });

  await prisma.scoutWallet.findFirstOrThrow({
    where: {
      address: listing.sellerWallet,
      scoutId
    }
  });

  if (listing.completedAt || listing.cancelledAt) {
    throw new Error('This listing is no longer active');
  }

  // If there's a seaport order hash, we need to cancel it on-chain as well
  if (listing.order) {
    const order = listing.order as OrderComponents;

    await cancelSeaportListing({
      order,
      sellerWallet: listing.sellerWallet
    });
  }

  const updatedListing = await prisma.builderNftListing.update({
    where: { id: listingId },
    data: {
      cancelledAt: new Date()
    }
  });

  return updatedListing;
}

export async function completeNftListing({ listingId, buyerWallet }: { listingId: string; buyerWallet: string }) {
  const listing = await prisma.builderNftListing.findUniqueOrThrow({
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

  const updatedListing = await prisma.builderNftListing.update({
    where: { id: listingId },
    data: {
      completedAt: new Date(),
      buyerWallet
    }
  });

  return updatedListing;
}
