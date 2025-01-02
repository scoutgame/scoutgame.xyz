import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import type { ISOWeek } from '../dates/config';
import { getCurrentSeasonStart } from '../dates/utils';

import { getBuilderContractMinterClient } from './clients/builderContractMinterWriteClient';
import { getBuilderContractStarterPackMinterClient } from './clients/builderContractStarterPackMinterWriteClient';
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

  const apiClient =
    nftType === 'starter_pack'
      ? getBuilderContractStarterPackMinterClient({
          chain: builderNftChain,
          contractAddress: getBuilderNftStarterPackContractAddress(season)
        })
      : getBuilderContractMinterClient({
          chain: builderNftChain,
          contractAddress: getBuilderNftContractAddress(season)
        });

  // Proceed with minting
  const txResult = await apiClient.mintTo({
    args: {
      account: recipientAddress as Address,
      tokenId: BigInt(builderNft.tokenId),
      amount: BigInt(amount),
      // For preseason02 onwards, we don't need to pass the scoutId as it's not used
      scout: (isPreseason01Contract(season) ? undefined : scoutId) as any
    }
  });

  await recordNftMint({ ...params, mintTxHash: txResult.transactionHash });
}
