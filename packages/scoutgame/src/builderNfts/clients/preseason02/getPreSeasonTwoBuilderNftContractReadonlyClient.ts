import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { ScoutGamePreSeason02NFTImplementationClient } from './wrappers/ScoutGamePreSeason02NFTImplementation';

export function getPreSeasonTwoBuilderNftContractReadonlyClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2025-W02');
  if (!contractAddress) {
    throw new Error('contract address missing for 2025-W02');
  }
  return new ScoutGamePreSeason02NFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
