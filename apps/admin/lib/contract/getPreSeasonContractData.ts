import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import { getPreSeasonOneBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/getPreSeasonOneBuilderNftContractReadonlyClient';
import { getPreSeasonOneBuilderNftProxyContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/getPreSeasonOneBuilderNftProxyContractReadonlyClient';
import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getPreSeasonTwoBuilderNftProxyContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason02/getPreSeasonTwoBuilderNftProxyContractReadonlyClient';
import {
  getBuilderNftContractAddress,
  lastBlockOfPreSeason01,
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

const scoutgameDotEth = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';

export async function getPreSeasonContractData({ season }: { season: ISOWeek }): Promise<PreSeasonNFTContractData> {
  const usdcClient = new UsdcErc20ABIClient({
    chain: optimism,
    publicClient: getPublicClient(optimism.id),
    contractAddress: usdcOptimismMainnetContractAddress
  });

  const preseason01Sales = await usdcClient.balanceOf({
    args: { account: scoutgameDotEth },
    blockNumber: BigInt(lastBlockOfPreSeason01)
  });

  if (season === '2024-W41') {
    const builderContractReadonlyApiClient = getPreSeasonOneBuilderNftContractReadonlyClient({
      chain: optimism,
      contractAddress: getBuilderNftContractAddress(season)
    });

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

    return {
      currentAdmin: currentAdmin as Address,
      currentMinter: currentMinter as Address,
      currentImplementation: currentImplementation as Address,
      proceedsReceiver: proceedsReceiver as Address,
      totalSupply,
      contractAddress: getBuilderNftContractAddress(season),
      receiverUsdcBalance: Number(preseason01Sales / BigInt(1e6)),
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

    const currentUsdcBalance = await usdcClient.balanceOf({ args: { account: scoutgameDotEth } });

    const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
      await Promise.all([
        builderProxyContractReadonlyApiClient.admin(),
        builderImplementationContractReadonlyApiClient.minter(),
        builderProxyContractReadonlyApiClient.implementation(),
        builderImplementationContractReadonlyApiClient.proceedsReceiver(),
        builderImplementationContractReadonlyApiClient.totalBuilderTokens(),
        aggregateNftSalesData({ nftType: 'default', season })
      ]);

    return {
      currentAdmin: currentAdmin as Address,
      currentMinter: currentMinter as Address,
      currentImplementation: currentImplementation as Address,
      proceedsReceiver: proceedsReceiver as Address,
      totalSupply,
      contractAddress: getBuilderNftContractAddress(season),
      receiverUsdcBalance: Number((currentUsdcBalance - preseason01Sales) / BigInt(1e6)),
      nftSalesData
    };
  } else {
    throw new Error(`Season ${season} not supported`);
  }
}
