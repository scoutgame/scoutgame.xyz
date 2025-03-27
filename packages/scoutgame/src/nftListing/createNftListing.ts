import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { isOnchainPlatform } from '@packages/utils/platform';
import { isAddress } from 'viem';

import { builderTokenDecimals } from '../builderNfts/constants';
import { devTokenDecimals } from '../protocol/constants';

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
  price: number;
  amount: number;
  scoutId: string;
  order: OrderWithCounter;
}) {
  const sellerWallet = _sellerWallet.toLowerCase();
  const isOnchain = isOnchainPlatform();

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
  const listing = await prisma.developerNftListing.create({
    data: {
      builderNftId,
      sellerWallet,
      price: isOnchain ? undefined : BigInt(price * 10 ** builderTokenDecimals),
      priceDevToken: isOnchain ? BigInt(price * 10 ** devTokenDecimals).toString() : undefined,
      amount,
      signature: order.signature,
      order: order as unknown as Prisma.InputJsonValue
    }
  });

  return listing;
}
