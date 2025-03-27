import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function getNftListings({
  builderNftId,
  sellerWallet,
  isActive
}: {
  builderNftId?: string | null;
  sellerWallet?: string | null;
  isActive?: boolean;
}) {
  const filters: Prisma.DeveloperNftListingWhereInput = {};

  if (builderNftId) {
    filters.builderNftId = builderNftId;
  }

  if (sellerWallet) {
    filters.sellerWallet = sellerWallet;
  }

  if (isActive) {
    filters.completedAt = null;
    filters.cancelledAt = null;
  }

  const listings = await prisma.developerNftListing.findMany({
    where: filters,
    include: {
      builderNft: true
    },
    orderBy: {
      price: 'asc'
    }
  });

  return { listings };
}
