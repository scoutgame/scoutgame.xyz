import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { parseEventLogs, type Address, type TransactionReceipt } from 'viem';

import { getNFTMinterClient } from '../protocol/clients/getNFTClient';
import { getStarterNFTMinterClient } from '../protocol/clients/getStarterNFTClient';

import { transferSingleAbi } from './accounting/getTransferSingleEvents';
import { recordNftMint } from './recordNftMint';

export type MintNFTParams = {
  builderNftId: string;
  recipientAddress: string;
  amount: number;
  pointsValue: number; // total value of purchase, after 50% discount, etc
  paidWithPoints: boolean; // whether to subtract from the scout's points
  scoutId: string;
  nftType: BuilderNftType;
  season?: ISOWeek;
};

export async function mintNFT(params: MintNFTParams) {
  const season = params.season ?? getCurrentSeasonStart();

  const { builderNftId, recipientAddress, amount, scoutId, nftType } = params;
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      id: builderNftId,
      season
    }
  });

  let txResult: TransactionReceipt | null = null;

  if (nftType === 'starter_pack') {
    const apiClient = getStarterNFTMinterClient(season);

    txResult = await apiClient.mintTo({
      args: {
        account: recipientAddress as Address,
        tokenId: BigInt(builderNft.tokenId),
        amount: BigInt(amount),
        scout: scoutId
      }
    });
  } else {
    const apiClient = getNFTMinterClient(season);

    txResult = await apiClient.mintTo({
      args: {
        account: recipientAddress as Address,
        tokenId: BigInt(builderNft.tokenId),
        amount: BigInt(amount)
      }
    });
  }

  if (!txResult) {
    throw new Error('Transaction failed');
  }

  const parsedLogs = parseEventLogs({
    abi: [transferSingleAbi],
    logs: txResult.logs,
    eventName: ['TransferSingle']
  });

  const mintTxLogIndex = parsedLogs[0].logIndex;

  await recordNftMint({ ...params, mintTxHash: txResult.transactionHash, mintTxLogIndex });

  // Proceed with minting
}
