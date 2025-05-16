import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { waitForTransactionReceipt } from '@packages/blockchain/waitForTransactionReceipt';
import { parseEventLogs } from 'viem';

import { transferSingleAbi } from './accounting/getTransferSingleEvents';

type MintValidation = {
  walletAddress: string;
  tokenId: number;
  tokensMinted: number;
  txHash: string;
  txLogIndex: number;
};

export async function validateTransferrableNftMint({
  txHash,
  chainId
}: {
  txHash: string;
  chainId: number;
}): Promise<MintValidation | null> {
  const client = getPublicClient(chainId);
  const onchainEvent = await waitForTransactionReceipt(
    getPublicClient(chainId),
    txHash as `0x${string}`,
    180_000,
    client.pollingInterval,
    2
  );
  const transferSingleEvent = parseEventLogs({
    abi: [transferSingleAbi],
    logs: onchainEvent.logs,
    eventName: ['TransferSingle']
  })[0];

  if (!transferSingleEvent) {
    return null;
  }

  return {
    walletAddress: transferSingleEvent.args.to,
    tokenId: Number(transferSingleEvent.args.id),
    tokensMinted: Number(transferSingleEvent.args.value),
    txHash,
    txLogIndex: transferSingleEvent.logIndex
  };
}
