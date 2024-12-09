import { builderContractStarterPackReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractStarterPackReadClient';
import { getBuilderStarterPackContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { Address } from 'viem';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type StarterPackNFTContractData = {
  totalSupply: bigint;
  contractAddress: Address;
  nftSalesData: NftSalesData;
};

export async function getStarterPackContractData(): Promise<StarterPackNFTContractData> {
  const [totalSupply, nftSalesData] = await Promise.all([
    builderContractStarterPackReadonlyApiClient.totalBuilderTokens(),
    aggregateNftSalesData({ nftType: 'starter_pack' })
  ]);

  return {
    totalSupply,
    contractAddress: getBuilderStarterPackContractAddress(),
    nftSalesData
  };
}
