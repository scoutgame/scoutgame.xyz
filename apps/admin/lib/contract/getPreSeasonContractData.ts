import { OPTIMISM_USDC_ADDRESS } from '@packages/blockchain/constants';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { ISOWeek } from '@packages/dates/config';
import { getBuilderNftContractAddress, lastBlockOfPreSeason01 } from '@packages/scoutgame/builderNfts/constants';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { getNFTReadonlyClient } from '@packages/scoutgame/protocol/clients/getNFTClient';
import { getProxyClient } from '@packages/scoutgame/protocol/clients/getProxyClient';
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
  chainName: string;
};

const scoutgameDotEth = '0x93326D53d1E8EBf0af1Ff1B233c46C67c96e4d8D';

export async function getPreSeasonContractData({ season }: { season: ISOWeek }): Promise<PreSeasonNFTContractData> {
  const usdcClient = new UsdcErc20ABIClient({
    chain: optimism,
    publicClient: getPublicClient(optimism.id),
    contractAddress: OPTIMISM_USDC_ADDRESS
  });

  const preseason01Sales = await usdcClient.balanceOf({
    args: { account: scoutgameDotEth },
    blockNumber: BigInt(lastBlockOfPreSeason01)
  });

  if (season === '2024-W41') {
    const builderContractReadonlyApiClient = getNFTReadonlyClient(season);
    const builderProxyContractReadonlyApiClient = getProxyClient(getBuilderNftContractAddress(season));

    const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
      await Promise.all([
        builderProxyContractReadonlyApiClient.admin(),
        builderContractReadonlyApiClient.getMinter(),
        builderProxyContractReadonlyApiClient.implementation(),
        () => Promise.resolve(scoutgameDotEth),
        // builderProxyContractReadonlyApiClient.getProceedsReceiver(),
        builderContractReadonlyApiClient.totalBuilderTokens(),
        aggregateNftSalesData({ nftType: 'default', season })
      ]);

    return {
      currentAdmin: currentAdmin as Address,
      currentMinter: currentMinter as Address,
      currentImplementation: currentImplementation as Address,
      proceedsReceiver: proceedsReceiver as Address,
      totalSupply,
      contractAddress: getBuilderNftContractAddress(season) as Address,
      receiverUsdcBalance: Number(preseason01Sales / BigInt(1e6)),
      nftSalesData,
      chainName: 'optimism'
    };
  } else {
    const builderImplementationContractReadonlyApiClient = getNFTReadonlyClient(season);
    const builderProxyContractReadonlyApiClient = getProxyClient(getBuilderNftContractAddress(season));

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
      chainName: 'optimism',
      contractAddress: getBuilderNftContractAddress(season) as Address,
      receiverUsdcBalance: Number((currentUsdcBalance - preseason01Sales) / BigInt(1e6)),
      nftSalesData
    };
  }
}
