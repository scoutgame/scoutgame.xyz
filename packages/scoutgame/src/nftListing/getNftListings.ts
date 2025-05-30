import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import type { Address } from 'viem';

import type { NftListing } from '../builders/interfaces';

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
    filters.builderNft = {
      season: getCurrentSeasonStart()
    };
  }

  if (isActive) {
    filters.completedAt = null;
    filters.builderNft = {
      season: getCurrentSeasonStart()
    };
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

export async function getDeveloperNftListings(developerId: string): Promise<NftListing[]> {
  const developerNftListings = await prisma.developerNftListing.findMany({
    where: {
      builderNft: {
        builderId: developerId,
        season: getCurrentSeasonStart()
      },
      completedAt: null
    },
    select: {
      id: true,
      price: true,
      priceDevToken: true,
      order: true,
      createdAt: true,
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

  return developerNftListings.map(({ builderNft, seller, ...rest }) => ({
    ...rest,
    scoutId: seller.scoutId,
    price: BigInt(rest.priceDevToken ?? 0),
    contractAddress: builderNft.contractAddress as Address,
    order: rest.order as OrderWithCounter
  }));
}
