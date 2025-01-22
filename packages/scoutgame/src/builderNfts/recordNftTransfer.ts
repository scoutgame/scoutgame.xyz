import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { getWeekFromDate } from '@packages/dates/utils';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import type { Address } from 'viem';

import { refreshScoutNftBalance } from './refreshScoutNftBalance';

type RecordNftTransferParams = {
  from: Address;
  to: Address;
  tokenId: number;
  amount: number;
  contractAddress: Address;
  txHash: string;
  sentAt: Date;
  scoutId: string;
};

export async function recordNftTransfer({
  contractAddress,
  amount,
  from,
  to,
  tokenId,
  txHash,
  sentAt,
  scoutId
}: RecordNftTransferParams): Promise<void> {
  const matchingNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      tokenId,
      contractAddress: {
        equals: contractAddress,
        mode: 'insensitive'
      }
    }
  });

  const fromWallet = from !== NULL_EVM_ADDRESS ? from.toLowerCase() : null;
  const toWallet = to !== NULL_EVM_ADDRESS ? to.toLowerCase() : null;

  const existingNftPurchaseEvent = await prisma.nFTPurchaseEvent.findFirst({
    where: {
      builderNftId: matchingNft.id,
      txHash,
      tokensPurchased: amount,
      senderWalletAddress: {
        equals: fromWallet,
        mode: 'insensitive'
      },
      walletAddress: {
        equals: toWallet,
        mode: 'insensitive'
      }
    }
  });

  if (existingNftPurchaseEvent) {
    return;
  }

  if (fromWallet) {
    await findOrCreateWalletUser({ wallet: fromWallet });
  }

  if (toWallet) {
    await findOrCreateWalletUser({ wallet: toWallet });
  }

  await prisma.builderEvent.create({
    data: {
      type: 'nft_purchase',
      season: matchingNft.season,
      week: getWeekFromDate(sentAt),
      builder: {
        connect: {
          id: matchingNft.builderId
        }
      },
      nftPurchaseEvent: {
        create: {
          pointsValue: 0,
          createdAt: sentAt,
          tokensPurchased: amount,
          paidInPoints: false,
          txHash: txHash?.toLowerCase(),
          builderNftId: matchingNft.id,
          walletAddress: toWallet,
          senderWalletAddress: fromWallet,
          scoutId,
          activities: {
            create: {
              recipientType: 'builder',
              type: 'nft_purchase',
              userId: matchingNft.builderId,
              createdAt: sentAt
            }
          }
        }
      }
    },
    select: {
      nftPurchaseEvent: true
    }
  });

  if (fromWallet) {
    await refreshScoutNftBalance({
      wallet: fromWallet as Address,
      tokenId,
      contractAddress,
      nftType: 'default'
    });
  }

  if (toWallet) {
    await refreshScoutNftBalance({
      wallet: toWallet as Address,
      tokenId,
      contractAddress,
      nftType: 'default'
    });
  }
}
