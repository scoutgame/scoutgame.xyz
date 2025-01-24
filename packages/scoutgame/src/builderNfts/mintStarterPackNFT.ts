import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';
import { parseEventLogs } from 'viem';

import { transferSingleAbi } from './accounting/getTransferSingleEvents';
import { getBuilderNftContractStarterPackMinterClient } from './clients/starterPack/getBuilderContractStarterPackMinterWriteClient';
import { recordNftMint } from './recordNftMint';

export type MintNFTParams = {
  builderNftId: string;
  recipientAddress: string;
  amount: number;
  pointsValue: number; // total value of purchase, after 50% discount, etc
  paidWithPoints: boolean; // whether to subtract from the scout's points
  scoutId: string;
};

export async function mintNFT(params: MintNFTParams) {
  const { builderNftId, recipientAddress, amount, scoutId } = params;
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId
    }
  });
  const apiClient = getBuilderNftContractStarterPackMinterClient();

  // Proceed with minting
  const txResult = await apiClient.mintTo({
    args: {
      account: recipientAddress as Address,
      tokenId: BigInt(builderNft.tokenId),
      amount: BigInt(amount),
      scout: scoutId
    }
  });

  const parsedLogs = parseEventLogs({
    abi: [transferSingleAbi],
    logs: txResult.logs,
    eventName: ['TransferSingle']
  });

  await recordNftMint({ ...params, mintTxHash: txResult.transactionHash, mintTxLogIndex: parsedLogs[0].logIndex });
}
