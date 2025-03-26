import { prisma } from '@charmverse/core/prisma-client';
import type { ethers } from 'ethers';
import { isAddress } from 'viem';

import { createSeaportListing } from '../seaport/createSeaportListing';

export async function createNftListing({
  builderNftId,
  sellerWallet: _sellerWallet,
  price,
  amount,
  scoutId,
  signer
}: {
  builderNftId: string;
  sellerWallet: string;
  price: string | number | bigint;
  amount: number;
  scoutId: string;
  signer: ethers.JsonRpcSigner;
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

  const nft = await prisma.builderNft.findUniqueOrThrow({
    where: { id: builderNftId },
    select: {
      contractAddress: true,
      tokenId: true
    }
  });

  // Create the seaport on-chain listing
  const { order, orderHash } = await createSeaportListing({
    sellerWallet,
    price,
    amount,
    contractAddress: nft.contractAddress,
    tokenId: nft.tokenId.toString(),
    signer
  });

  // Create the listing in our database
  const listing = await prisma.builderNftListing.create({
    data: {
      builderNftId,
      sellerWallet,
      price: BigInt(price),
      amount,
      signature: order.signature,
      orderHash,
      order: JSON.stringify({
        parameters: order.parameters
      })
    }
  });

  return {
    listing,
    order
  };
}
