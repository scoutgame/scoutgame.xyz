import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address, Hash } from 'viem';
import { isAddress } from 'viem';

import { getTransferSingleWithBatchMerged } from '../builderNfts/accounting/getTransferSingleWithBatchMerged';
import { recordNftTransfer } from '../builderNfts/recordNftTransfer';
import { sendAppNotification } from '../notifications/sendAppNotification';
import { devTokenDecimals, scoutProtocolChain } from '../protocol/constants';

export async function purchaseNftListing({
  listingId,
  buyerWallet: _buyerWallet,
  txHash,
  scoutId
}: {
  listingId: string;
  buyerWallet: Address;
  txHash: Hash;
  scoutId: string;
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
  const listing = await prisma.developerNftListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      builderNftId: true,
      amount: true,
      price: true,
      priceDevToken: true,
      completedAt: true,
      sellerWallet: true,
      seller: {
        select: {
          scoutId: true
        }
      },
      order: true,
      builderNft: {
        select: {
          builder: {
            select: {
              id: true,
              displayName: true
            }
          },
          contractAddress: true,
          tokenId: true
        }
      }
    }
  });

  // Ensure the listing is active
  if (listing.completedAt) {
    throw new Error('This listing is no longer active');
  }

  // Get the block number from the tx hash
  const publicClient = getPublicClient(scoutProtocolChain.id);
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  const blockNumber = receipt.blockNumber;

  const transferEvents = await getTransferSingleWithBatchMerged({
    fromBlock: blockNumber,
    toBlock: blockNumber,
    contractAddress: listing.builderNft.contractAddress as Address,
    chainId: scoutProtocolChain.id
  });

  const transferEvent = transferEvents.find(
    (event) =>
      event.args.from.toLowerCase() === listing.sellerWallet.toLowerCase() &&
      event.args.to.toLowerCase() === buyerWallet &&
      event.args.id === BigInt(listing.builderNft.tokenId)
  );

  if (!transferEvent) {
    throw new Error('NFT transfer event not found');
  }

  const updatedListing = await prisma.developerNftListing.update({
    where: { id: listingId },
    data: {
      completedAt: new Date(),
      buyerWallet,
      hash: txHash
    }
  });

  const contractAddress = listing.builderNft.contractAddress as Address;

  await recordNftTransfer({
    contractAddress,
    transferSingleEvent: transferEvent
  });

  const price = BigInt(listing.priceDevToken as string);
  const priceInDecimal = Number(price) / 10 ** devTokenDecimals;
  const developerEarnings = priceInDecimal * 0.01; // 1%
  const sellerEarnings = priceInDecimal * 0.95; // 95%

  try {
    await sendAppNotification({
      userId: listing.seller.scoutId,
      notificationType: 'sold_nft_listing_seller',
      notificationVariables: {
        developerName: listing.builderNft.builder.displayName,
        earnedAmount: sellerEarnings,
        tokenName: 'DEV'
      }
    });

    await sendAppNotification({
      userId: listing.builderNft.builder.id,
      notificationType: 'sold_nft_listing_developer',
      notificationVariables: {
        earnedAmount: developerEarnings,
        tokenName: 'DEV'
      }
    });
  } catch (error) {
    log.error('Error sending notification', {
      error,
      listingId
    });
  }

  return {
    listing: updatedListing
  };
}
