import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getBuilderNftStarterPackProxyReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/getBuilderContractStarterPackProxyReadonlyClient';
import { getBuilderNftStarterPackReadonlyClient } from '@packages/scoutgame/builderNfts/clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { getBuilderNftStarterPackContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type StarterPackNFTContractData = {
  totalSupply: bigint;
  contractAddress: Address;
  currentMinter: Address;
  currentImplementation: Address;
  nftSalesData: NftSalesData;
  admin: Address;
  proceedsReceiver: Address;
};

export async function getStarterPackContractData({ season }: { season: ISOWeek }): Promise<StarterPackNFTContractData> {
  const starterPackClient = getBuilderNftStarterPackReadonlyClient({
    chain: optimism,
    contractAddress: getBuilderNftStarterPackContractAddress(season)
  });

  const starterPackProxyClient = getBuilderNftStarterPackProxyReadonlyClient({
    chain: optimism,
    contractAddress: getBuilderNftStarterPackContractAddress(season)
  });

  const [currentMinter, totalSupply, nftSalesData, currentImplementation, admin, proceedsReceiver] = await Promise.all([
    starterPackClient.getMinter(),
    // TODO: call contract instead once we fix totalBuilderTokens?
    prisma.builderNft.count({ where: { nftType: 'starter_pack', season } }).then((count) => BigInt(count)),
    // builderContractStarterPackReadonlyApiClient.totalBuilderTokens(),
    aggregateNftSalesData({ nftType: 'starter_pack', season }),
    starterPackProxyClient.implementation(),
    starterPackProxyClient.admin(),
    starterPackClient.getProceedsReceiver()
  ]);

  return {
    totalSupply,
    currentMinter: currentMinter as Address,
    contractAddress: getBuilderNftStarterPackContractAddress(season),
    nftSalesData,
    currentImplementation,
    admin,
    proceedsReceiver
  };
}
