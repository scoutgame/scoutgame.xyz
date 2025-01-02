import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import type { ISOWeek } from '../dates/config';
import { getCurrentSeasonStart } from '../dates/utils';

import { getBuilderContractMinterClient } from './clients/builderContractMinterWriteClient';
import { getBuilderContractStarterPackMinterClient } from './clients/builderContractStarterPackMinterWriteClient';
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
  const apiClient =
    nftType === 'starter_pack' ? getBuilderContractStarterPackMinterClient() : getBuilderContractMinterClient();

  // Proceed with minting
  const txResult = await apiClient.mintTo({
    args: {
      account: recipientAddress as Address,
      tokenId: BigInt(builderNft.tokenId),
      amount: BigInt(amount),
      scout: scoutId
    }
  });

  await recordNftMint({ ...params, mintTxHash: txResult.transactionHash });
}
