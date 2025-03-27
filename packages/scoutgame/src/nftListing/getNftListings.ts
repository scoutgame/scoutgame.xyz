import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { isOnchainPlatform } from '@packages/utils/platform';
import type { Address } from 'viem';

import type { DeveloperNftListing } from '../builders/interfaces';

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

export async function getDeveloperNftListings(developerId: string): Promise<DeveloperNftListing[]> {
  const developerNftListings = await prisma.developerNftListing.findMany({
    where: {
      builderNft: {
        builderId: developerId
      }
    },
    select: {
      id: true,
      price: true,
      priceDevToken: true,
      order: true,
      seller: {
        select: {
          scoutId: true
        }
      },
      builderNft: {
        select: {
          contractAddress: true
        }
      }
    }
  });

  const isOnchain = isOnchainPlatform();

  return developerNftListings.map(({ builderNft, seller, ...rest }) => ({
    ...rest,
    scoutId: seller.scoutId,
    price: isOnchain ? BigInt(rest.priceDevToken ?? 0) : BigInt(rest.price ?? 0),
    contractAddress: builderNft.contractAddress as Address,
    order: rest.order as OrderWithCounter
  }));
}
