import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { isAddress } from 'viem';

export async function createNftListing({
  builderNftId,
  sellerWallet: _sellerWallet,
  price,
  amount,
  order,
  scoutId
}: {
  builderNftId: string;
  sellerWallet: string;
  price: bigint;
  amount: number;
  scoutId: string;
  order: OrderWithCounter;
}) {
  const sellerWallet = _sellerWallet.toLowerCase();

  if (!isAddress(sellerWallet)) {
    throw new Error('Invalid wallet address');
  }

  // Verify the wallet belongs to the current user
  await prisma.scoutWallet.findFirstOrThrow({
    where: {
      address: sellerWallet,
      scoutId
    }
  });

  // Check if the user owns the NFT
  await prisma.scoutNft.findFirstOrThrow({
    where: {
      builderNftId,
      walletAddress: sellerWallet,
      balance: {
        gte: amount
      }
    }
  });

  // Create the listing in our database
  const listing = await prisma.builderNftListing.create({
    data: {
      builderNftId,
      sellerWallet,
      price,
      amount,
      signature: order.signature,
      order: order as unknown as Prisma.InputJsonValue
    }
  });

  return listing;
}
