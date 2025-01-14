import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import { getPreSeasonOneBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/getPreSeasonOneBuilderNftContractReadonlyClient';
import { getPreSeasonOneBuilderNftProxyContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/getPreSeasonOneBuilderNftProxyContractReadonlyClient';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getPreSeasonTwoBuilderNftProxyContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftProxyContractReadonlyClient';
import {
  getBuilderNftContractAddress,
  usdcOptimismMainnetContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type PreSeasonNFTContractData = {
  currentAdmin: Address;
  currentMinter: Address;
  currentImplementation: Address;
  proceedsReceiver: Address;
  totalSupply: bigint;
  contractAddress: Address;
  receiverUsdcBalance: number;
  nftSalesData: NftSalesData;
};

export async function getPreSeasonContractData({ season }: { season: ISOWeek }): Promise<PreSeasonNFTContractData> {
  const builderContractReadonlyApiClient = getPreSeasonOneBuilderNftContractReadonlyClient({
    chain: optimism,
    contractAddress: getBuilderNftContractAddress(season)
  });

  if (season === '2024-W41') {
    const builderProxyContractReadonlyApiClient = getPreSeasonOneBuilderNftProxyContractReadonlyClient({
      chain: optimism,
      contractAddress: getBuilderNftContractAddress(season)
    });

    const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
      await Promise.all([
        builderProxyContractReadonlyApiClient.admin(),
        builderContractReadonlyApiClient.getMinter(),
        builderProxyContractReadonlyApiClient.implementation(),
        builderProxyContractReadonlyApiClient.getProceedsReceiver(),
        builderContractReadonlyApiClient.totalBuilderTokens(),
        aggregateNftSalesData({ nftType: 'default', season })
      ]);

    const balance = await new UsdcErc20ABIClient({
      chain: optimism,
      publicClient: getPublicClient(optimism.id),
      contractAddress: usdcOptimismMainnetContractAddress
    }).balanceOf({ args: { account: proceedsReceiver } });

    return {
      currentAdmin: currentAdmin as Address,
      currentMinter: currentMinter as Address,
      currentImplementation: currentImplementation as Address,
      proceedsReceiver: proceedsReceiver as Address,
      totalSupply,
      contractAddress: getBuilderNftContractAddress(season),
      receiverUsdcBalance: Number(balance / BigInt(1e6)),
      nftSalesData
    };
  } else if (season === '2025-W02') {
    const builderImplementationContractReadonlyApiClient = getPreSeasonTwoBuilderNftContractReadonlyClient({
      chain: optimism,
      contractAddress: getBuilderNftContractAddress(season)
    });

    const builderProxyContractReadonlyApiClient = getPreSeasonTwoBuilderNftProxyContractReadonlyClient({
      chain: optimism,
      contractAddress: getBuilderNftContractAddress(season)
    });

    const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
      await Promise.all([
        builderProxyContractReadonlyApiClient.admin(),
        builderImplementationContractReadonlyApiClient.minter(),
        builderProxyContractReadonlyApiClient.implementation(),
        builderImplementationContractReadonlyApiClient.proceedsReceiver(),
        builderImplementationContractReadonlyApiClient.totalBuilderTokens(),
        aggregateNftSalesData({ nftType: 'default', season })
      ]);

    const balance = await new UsdcErc20ABIClient({
      chain: optimism,
      publicClient: getPublicClient(optimism.id),
      contractAddress: usdcOptimismMainnetContractAddress
    }).balanceOf({ args: { account: proceedsReceiver } });

    return {
      currentAdmin: currentAdmin as Address,
      currentMinter: currentMinter as Address,
      currentImplementation: currentImplementation as Address,
      proceedsReceiver: proceedsReceiver as Address,
      totalSupply,
      contractAddress: getBuilderNftContractAddress(season),
      receiverUsdcBalance: Number(balance / BigInt(1e6)),
      nftSalesData
    };
  } else {
    throw new Error(`Season ${season} not supported`);
  }
}
