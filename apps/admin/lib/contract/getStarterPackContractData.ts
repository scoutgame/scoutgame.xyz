import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getBuilderNftStarterPackReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/builderContractStarterPackReadClient';
import { getBuilderNftStarterPackContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type StarterPackNFTContractData = {
  totalSupply: bigint;
  contractAddress: Address;
  currentMinter: Address;
  nftSalesData: NftSalesData;
};

export async function getStarterPackContractData({ season }: { season: ISOWeek }): Promise<StarterPackNFTContractData> {
  const [currentMinter, totalSupply, nftSalesData] = await Promise.all([
    getBuilderNftStarterPackReadonlyClient({
      chain: optimism,
      contractAddress: getBuilderNftStarterPackContractAddress(season)
    }).getMinter(),
    // TODO: call contract instead once we fix totalBuilderTokens?
    prisma.builderNft.count({ where: { nftType: 'starter_pack', season } }).then((count) => BigInt(count)),
    // builderContractStarterPackReadonlyApiClient.totalBuilderTokens(),
    aggregateNftSalesData({ nftType: 'starter_pack', season })
  ]);

  return {
    totalSupply,
    currentMinter: currentMinter as Address,
    contractAddress: getBuilderNftStarterPackContractAddress(season),
    nftSalesData
  };
}
