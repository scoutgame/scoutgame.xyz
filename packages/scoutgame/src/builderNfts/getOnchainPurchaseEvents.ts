import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import type { BuilderScoutedEvent } from './accounting/getBuilderScoutedEvents';
import { getBuilderScoutedEvents } from './accounting/getBuilderScoutedEvents';
import type { TransferSingleEvent } from './accounting/getTransferSingleEvents';
import { getTransferSingleEvents } from './accounting/getTransferSingleEvents';
import {
  builderNftChain,
  getBuilderNftContractAddress,
  getBuilderNftStarterPackContractAddress,
  validMintNftPurchaseEvent
} from './constants';

type SimplifiedGroupedEvent = {
  scoutId: string;
  amount: bigint;
  tokenId: bigint;
  txHash: string;
  blockNumber: bigint;
  transferEvent: TransferSingleEvent['args'];
  builderScoutedEvent: BuilderScoutedEvent['args'];
};

async function getOnchainEvents(query: {
  fromBlock?: number;
  toBlock?: number;
  contractAddress: Address;
  chainId: number;
}) {
  const [builderEventLogs, transferSingleEventLogs] = await Promise.all([
    getBuilderScoutedEvents(query),
    getTransferSingleEvents(query)
  ]);

  return groupEventsByTransactionHash([...builderEventLogs, ...transferSingleEventLogs]);
}

export async function getOnchainPurchaseEvents({
  scoutId,
  fromBlock,
  toBlock,
  season
}: {
  scoutId: string;
  season: ISOWeek;
  fromBlock?: number;
  toBlock?: number;
}) {
  const [groupedNftEvents, groupedStarterPackEvents] = await Promise.all([
    getOnchainEvents({
      fromBlock,
      toBlock,
      contractAddress: getBuilderNftContractAddress(season),
      chainId: builderNftChain.id
    }),
    getOnchainEvents({
      fromBlock,
      toBlock,
      contractAddress: getBuilderNftStarterPackContractAddress(season),
      chainId: builderNftChain.id
    })
  ]);

  const fromBlockTimestamp = fromBlock
    ? await getPublicClient(optimism.id)
        .getBlock({ blockNumber: BigInt(fromBlock), includeTransactions: false })
        .then((block) => new Date(Number(block.timestamp) * 1000))
    : undefined;

  const nftPurchases = await prisma.nFTPurchaseEvent.findMany({
    where: {
      ...validMintNftPurchaseEvent,
      scoutWallet: {
        scoutId
      },
      createdAt: fromBlockTimestamp
        ? {
            gte: fromBlockTimestamp
          }
        : undefined
    },
    select: {
      txHash: true,
      tokensPurchased: true,
      paidInPoints: true,
      pointsValue: true
    }
  });

  const pendingTransactions = await prisma.pendingNftTransaction.findMany({
    where: {
      userId: scoutId,
      createdAt: fromBlockTimestamp ? { gte: fromBlockTimestamp } : undefined
    },
    select: {
      id: true,
      sourceChainTxHash: true,
      sourceChainId: true,
      destinationChainTxHash: true,
      destinationChainId: true,
      tokenAmount: true,
      targetAmountReceived: true
    }
  });

  const mappedEvents = [...groupedNftEvents, ...groupedStarterPackEvents]
    .filter((event) => event.scoutId === scoutId)
    .map((event) => {
      const nftPurchase = nftPurchases.find((nft) => nft.txHash.toLowerCase() === event.txHash.toLowerCase()) ?? null;
      const pendingTransaction =
        pendingTransactions.find(
          (tx) => tx.sourceChainTxHash === event.txHash || tx.destinationChainTxHash === event.txHash
        ) ?? null;
      return { ...event, nftPurchase, pendingTransaction };
    });

  return mappedEvents;
}

function groupEventsByTransactionHash(events: (BuilderScoutedEvent | TransferSingleEvent)[]): SimplifiedGroupedEvent[] {
  const eventMap: Record<string, Partial<SimplifiedGroupedEvent>> = {};

  for (const baseEvent of events) {
    const event = baseEvent;
    const { transactionHash, blockNumber } = event;

    if (!eventMap[transactionHash]) {
      eventMap[transactionHash] = { txHash: transactionHash, blockNumber: blockNumber as any };
    }
    if (event.eventName === 'TransferSingle') {
      eventMap[transactionHash].transferEvent = event.args;
      eventMap[transactionHash].tokenId = event.args.id;
    } else if (event.eventName === 'BuilderScouted') {
      eventMap[transactionHash].scoutId = event.args.scout;
      eventMap[transactionHash].amount = event.args.amount;
    }
  }

  return Object.values(eventMap).map((entry) => ({
    scoutId: entry.scoutId!,
    amount: entry.amount!,
    tokenId: entry.tokenId!,
    txHash: entry.txHash!,
    blockNumber: entry.blockNumber!,
    transferEvent: entry.transferEvent!,
    builderScoutedEvent: entry.builderScoutedEvent!
  }));
}
