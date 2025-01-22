import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getWeekFromDate } from '@packages/dates/utils';
import { findOrCreateWalletUser } from '@packages/users/findOrCreateWalletUser';
import type { Address } from 'viem';

import type { TransferSingleEvent } from './accounting/getTransferSingleEvents';
import { builderNftChain } from './constants';
import { getMatchingNFTPurchaseEvent } from './getMatchingNFTPurchaseEvent';
import { refreshScoutNftBalance } from './refreshScoutNftBalance';

type RecordNftTransferParams = {
  transferSingleEvent: TransferSingleEvent;
  contractAddress: Address;
};

export async function recordNftTransfer({
  contractAddress,
  transferSingleEvent
}: RecordNftTransferParams): Promise<void> {
  const matchingNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      tokenId: Number(transferSingleEvent.args.id),
      contractAddress: {
        equals: contractAddress,
        mode: 'insensitive'
      }
    }
  });

  const { from, to } = transferSingleEvent.args;

  const txHash = transferSingleEvent.transactionHash;
  const logIndex = transferSingleEvent.logIndex;

  const fromWallet = from !== NULL_EVM_ADDRESS ? from.toLowerCase() : null;
  const toWallet = to !== NULL_EVM_ADDRESS ? to.toLowerCase() : null;

  if (!toWallet) {
    log.warn('Skipping burn transaction', { transferSingleEvent });
    return;
  }

  const existingNftPurchaseEvent = await getMatchingNFTPurchaseEvent({
    builderNftId: matchingNft.id,
    tokensPurchased: Number(transferSingleEvent.args.value),
    txHash,
    txLogIndex: logIndex,
    senderWalletAddress: fromWallet,
    walletAddress: toWallet
  });

  if (existingNftPurchaseEvent) {
    return;
  }

  const scoutId: string = await findOrCreateWalletUser({ wallet: toWallet }).then((user) => user.id);

  if (fromWallet) {
    await findOrCreateWalletUser({ wallet: fromWallet });
  }

  const _sentAt = await getPublicClient(builderNftChain.id)
    .getBlock({
      blockNumber: transferSingleEvent.blockNumber
    })
    .then((block) => Number(block.timestamp) * 1000);

  const sentAt = new Date(_sentAt);

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
          tokensPurchased: Number(transferSingleEvent.args.value),
          paidInPoints: false,
          txHash: txHash?.toLowerCase(),
          builderNftId: matchingNft.id,
          walletAddress: toWallet,
          senderWalletAddress: fromWallet,
          txLogIndex: logIndex,
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
      tokenId: Number(transferSingleEvent.args.id),
      contractAddress,
      nftType: 'default'
    });
  }

  if (toWallet) {
    await refreshScoutNftBalance({
      wallet: toWallet as Address,
      tokenId: Number(transferSingleEvent.args.id),
      contractAddress,
      nftType: 'default'
    });
  }
}
