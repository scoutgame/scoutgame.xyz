import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { parseEventLogs } from 'viem';

import { getScoutProtocolBuilderNFTReadonlyContract } from '../protocol/constants';

type MintValidation = {
  walletAddress: string;
  tokenId: number;
  tokensMinted: number;
};

export async function validateTransferrableNftMint({
  txHash,
  chainId
}: {
  txHash: string;
  chainId: number;
}): Promise<MintValidation | null> {
  const onchainEvent = await getPublicClient(chainId).waitForTransactionReceipt({
    hash: txHash as `0x${string}`
  });

  const transferSingleEvent = parseEventLogs({
    abi: getScoutProtocolBuilderNFTReadonlyContract().abi,
    logs: onchainEvent.logs,
    eventName: ['TransferSingle']
  })[0];

  if (!transferSingleEvent) {
    return null;
  }

  return {
    walletAddress: transferSingleEvent.args.to,
    tokenId: Number(transferSingleEvent.args.id),
    tokensMinted: Number(transferSingleEvent.args.value)
  };
}
