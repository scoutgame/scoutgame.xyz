import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { refreshScoutNftBalance } from './refreshScoutNftBalance';

type RecordNftTransferParams = {
  from: Address;
  to: Address;
  tokenId: number;
  amount: number;
  contractAddress: Address;
  txHash: string;
};

export async function recordNftTransfer({
  contractAddress,
  amount,
  from,
  to,
  tokenId,
  txHash
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

  await Promise.all([
    refreshScoutNftBalance({
      wallet: from,
      tokenId,
      contractAddress,
      nftType: 'default'
    }),
    refreshScoutNftBalance({
      wallet: to,
      tokenId,
      contractAddress,
      nftType: 'default'
    })
  ]);

  const existingNftPurchaseEvent = await prisma.nFTPurchaseEvent.findFirst({
    where: {
      builderNftId: matchingNft.id,
      txHash,
      senderWalletAddress: {
        equals: from.toLowerCase(),
        mode: 'insensitive'
      },
      walletAddress: {
        equals: to.toLowerCase(),
        mode: 'insensitive'
      }
    }
  });

  if (existingNftPurchaseEvent) {
    return;
  }

  await prisma.nFTPurchaseEvent.create({
    data: {
      // An NFT transferred in the secondary market does not generate points
      pointsValue: 0,
      tokensPurchased: amount,
      txHash,
      senderWalletAddress: from.toLowerCase(),
      walletAddress: to.toLowerCase(),
      builderNftId: matchingNft.id
    }
  });
}
