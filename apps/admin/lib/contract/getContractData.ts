import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getPreSeasonOneBuilderNftContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/preSeasonOneBuilderNftContractReadonlyClient';
import { getPreSeasonOneBuilderNftProxyContractReadonlyClient } from '@packages/scoutgame/builderNfts/clients/preseason01/preSeasonOneBuilderNftProxyContractReadonlyClient';
import {
  getBuilderNftContractAddress,
  usdcOptimismMainnetContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type BuilderNFTContractData = {
  currentAdmin: Address;
  currentMinter: Address;
  currentImplementation: Address;
  proceedsReceiver: Address;
  totalSupply: bigint;
  contractAddress: Address;
  receiverUsdcBalance: number;
  nftSalesData: NftSalesData;
};

export async function getContractData(): Promise<BuilderNFTContractData> {
  const builderContractReadonlyApiClient = getPreSeasonOneBuilderNftContractReadonlyClient({
    chain: optimism,
    contractAddress: getBuilderNftContractAddress('2024-W41')
  });
  const builderProxyContractReadonlyApiClient = getPreSeasonOneBuilderNftProxyContractReadonlyClient({
    chain: optimism,
    contractAddress: getBuilderNftContractAddress('2024-W41')
  });

  const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
    await Promise.all([
      builderProxyContractReadonlyApiClient.admin(),
      builderContractReadonlyApiClient.getMinter(),
      builderProxyContractReadonlyApiClient.implementation(),
      builderProxyContractReadonlyApiClient.getProceedsReceiver(),
      builderContractReadonlyApiClient.totalBuilderTokens(),
      aggregateNftSalesData({ nftType: 'default' })
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
    contractAddress: getBuilderNftContractAddress(),
    receiverUsdcBalance: Number(balance / BigInt(1e6)),
    nftSalesData
  };
}
