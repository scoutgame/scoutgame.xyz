import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { parseEventLogs, type Address, type TransactionReceipt } from 'viem';
import { optimism } from 'viem/chains';

import { transferSingleAbi } from './accounting/getTransferSingleEvents';
import { getPreSeasonOneBuilderNftContractMinterClient } from './clients/preseason01/getPreSeasonOneBuilderNftContractMinterClient';
import { getPreSeasonTwoBuilderNftContractMinterClient } from './clients/preseason02/getPreSeasonTwoBuilderNftContractMinterClient';
import { getBuilderNftContractStarterPackMinterClient } from './clients/starterPack/getBuilderContractStarterPackMinterWriteClient';
import {
  builderNftChain,
  getBuilderNftContractAddress,
  getBuilderNftStarterPackContractAddress,
  isPreseason01Contract
} from './constants';
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
    const apiClient = getBuilderNftContractStarterPackMinterClient({
      chain: builderNftChain,
      contractAddress: getBuilderNftStarterPackContractAddress(season)
    });

    txResult = await apiClient.mintTo({
      args: {
        account: recipientAddress as Address,
        tokenId: BigInt(builderNft.tokenId),
        amount: BigInt(amount),
        // For preseason02 onwards, we don't need to pass the scoutId as it's not used, except for starter packs which use the scoutId to track the mint status
        scout: (!isPreseason01Contract(season) && nftType !== 'starter_pack' ? undefined : scoutId) as any
      }
    });
  } else if (season === '2024-W41') {
    const apiClient = getPreSeasonOneBuilderNftContractMinterClient({
      chain: optimism,
      contractAddress: getBuilderNftContractAddress(season)
    });

    txResult = await apiClient.mintTo({
      args: {
        account: recipientAddress as Address,
        tokenId: BigInt(builderNft.tokenId),
        amount: BigInt(amount),
        scout: scoutId
      }
    });
  } else {
    const apiClient = getPreSeasonTwoBuilderNftContractMinterClient({
      chain: builderNftChain,
      contractAddress: getBuilderNftContractAddress(season)
    });

    txResult = await apiClient.mintTo({
      args: {
        account: recipientAddress as Address,
        tokenId: BigInt(builderNft.tokenId),
        amount: BigInt(amount)
      }
    });
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
