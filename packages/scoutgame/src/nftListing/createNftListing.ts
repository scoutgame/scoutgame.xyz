import { prisma } from '@charmverse/core/prisma-client';
import { isAddress } from 'viem';

export async function createNftListing({
  builderNftId,
  sellerWallet: _sellerWallet,
  price,
  amount,
  signature,
  scoutId
}: {
  builderNftId: string;
  sellerWallet: string;
  price: string | number | bigint;
  amount: number;
  signature: string;
  scoutId: string;
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

  // Create the listing
  const listing = await prisma.builderNftListing.create({
    data: {
      builderNftId,
      sellerWallet,
      price: BigInt(price),
      amount,
      signature
    }
  });

  return listing;
}
