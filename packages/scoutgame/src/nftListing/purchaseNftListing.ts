import { prisma } from '@charmverse/core/prisma-client';
import type { OrderParameters } from '@opensea/seaport-js/lib/types';
import type { ethers } from 'ethers';
import { isAddress } from 'viem';

import { purchaseSeaportListing } from '../seaport/purchaseSeaportListing';

export async function purchaseNftListing({
  listingId,
  buyerWallet: _buyerWallet,
  txHash,
  txLogIndex,
  scoutId,
  signer
}: {
  listingId: string;
  buyerWallet: string;
  txHash: string;
  txLogIndex: number;
  scoutId: string;
  signer: ethers.JsonRpcSigner;
}) {
  const buyerWallet = _buyerWallet.toLowerCase();

  if (!isAddress(buyerWallet)) {
    throw new Error('Invalid wallet address');
  }

  // Verify the wallet belongs to the current user
  await prisma.scoutWallet.findFirstOrThrow({
    where: {
      address: buyerWallet,
      scoutId
    }
  });

  // Find the listing
  const listing = await prisma.builderNftListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      builderNftId: true,
      amount: true,
      completedAt: true,
      cancelledAt: true,
      sellerWallet: true,
      orderHash: true,
      order: true,
      signature: true
    }
  });

  // Ensure the listing is active
  if (listing.completedAt || listing.cancelledAt) {
    throw new Error('This listing is no longer active');
  }

  // Purchase the NFT on-chain using Seaport if we have the order data
  if (listing.orderHash && listing.order) {
    const order = listing.order as OrderParameters;

    await purchaseSeaportListing({
      orderHash: listing.orderHash,
      signature: listing.signature,
      orderParameters: order,
      buyerWallet,
      signer
    });
  }

  const { updatedListing, createdNftPurchaseEvent } = await prisma.$transaction(async (tx) => {
    // Mark the listing as completed
    const _updatedListing = await tx.builderNftListing.update({
      where: { id: listingId },
      data: {
        completedAt: new Date(),
        buyerWallet
      }
    });

    // Create NFT purchase event record
    const _createdNftPurchaseEvent = await tx.nFTPurchaseEvent.create({
      data: {
        builderNftId: listing.builderNftId,
        tokensPurchased: listing.amount,
        pointsValue: 0,
        txHash,
        txLogIndex,
        walletAddress: buyerWallet,
        senderWalletAddress: listing.sellerWallet
      }
    });

    // Update NFT ownership - subtract from seller
    await tx.scoutNft.update({
      where: {
        builderNftId_walletAddress: {
          builderNftId: listing.builderNftId,
          walletAddress: listing.sellerWallet
        }
      },
      data: {
        balance: {
          decrement: listing.amount
        }
      }
    });

    await tx.scoutNft.upsert({
      where: {
        builderNftId_walletAddress: {
          builderNftId: listing.builderNftId,
          walletAddress: buyerWallet
        }
      },
      update: {
        balance: {
          increment: listing.amount
        }
      },
      create: {
        builderNftId: listing.builderNftId,
        walletAddress: buyerWallet,
        balance: listing.amount
      }
    });

    return { updatedListing: _updatedListing, createdNftPurchaseEvent: _createdNftPurchaseEvent };
  });

  return {
    listing: updatedListing,
    purchaseEvent: createdNftPurchaseEvent
  };
}
