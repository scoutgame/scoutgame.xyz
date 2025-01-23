import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { parseEventLogs } from 'viem';

import { builderScoutedAbi } from './accounting/getBuilderScoutedEvents';

type MintValidation = {
  scoutId: string;
  tokenId: number;
  tokensMinted: number;
  txHash: string;
  txLogIndex: number;
};

export async function validatePreseason01orStarterPackMint({
  txHash,
  chainId
}: {
  txHash: string;
  chainId: number;
}): Promise<MintValidation | null> {
  const onchainEvent = await getPublicClient(chainId).waitForTransactionReceipt({
    hash: txHash as `0x${string}`
  });

  const builderScoutedEvent = parseEventLogs({
    abi: [builderScoutedAbi],
    logs: onchainEvent.logs,
    eventName: ['BuilderScouted']
  })[0];

  const transferSingleEvent = parseEventLogs({
    abi: [builderScoutedAbi],
    logs: onchainEvent.logs,
    eventName: ['BuilderScouted']
  })[0];

  if (!builderScoutedEvent || !transferSingleEvent) {
    return null;
  }

  return {
    scoutId: builderScoutedEvent.args.scout,
    tokenId: Number(builderScoutedEvent.args.tokenId),
    tokensMinted: Number(builderScoutedEvent.args.amount),
    txHash,
    txLogIndex: transferSingleEvent.logIndex
  };
}
