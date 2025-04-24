import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getSeasonConfig } from '@packages/dates/utils';
import { getStarterNFTContractAddress } from '@packages/scoutgame/builderNfts/constants';
import { getProxyClient } from '@packages/scoutgame/protocol/clients/getProxyClient';
import { getStarterNFTReadonlyClient } from '@packages/scoutgame/protocol/clients/getStarterNFTClient';
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
  chainName: string;
};

export async function getStarterPackContractData({ season }: { season: ISOWeek }): Promise<StarterPackNFTContractData> {
  const starterPackClient = getStarterNFTReadonlyClient(season)!;

  const starterPackProxyClient = getProxyClient(getStarterNFTContractAddress(season) as Address);

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

  const seasonConfig = getSeasonConfig(season);

  return {
    totalSupply,
    currentMinter: currentMinter as Address,
    contractAddress: getStarterNFTContractAddress(season)!,
    nftSalesData,
    currentImplementation,
    admin,
    proceedsReceiver,
    chainName: seasonConfig.preseason ? 'optimism' : 'base'
  };
}
