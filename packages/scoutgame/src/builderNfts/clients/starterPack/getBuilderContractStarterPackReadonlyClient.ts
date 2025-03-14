import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeason } from '@packages/dates/utils';
import { base, optimism } from 'viem/chains';

import { getBuilderNftStarterPackContractAddress } from '../../constants';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

export function getBuilderNftStarterPackReadonlyClient() {
  const season = getCurrentSeason();
  const chain = season.preseason ? optimism : base;
  const contractAddress = getBuilderNftStarterPackContractAddress(season.start);
  return new ScoutGameStarterPackNFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
