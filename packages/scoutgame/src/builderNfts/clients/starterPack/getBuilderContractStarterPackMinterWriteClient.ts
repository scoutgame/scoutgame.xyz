import { getCurrentSeason } from '@packages/dates/utils';
import { base, optimism } from 'viem/chains';

import { getBuilderNftStarterPackContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderNftContractStarterPackMinterClient() {
  const season = getCurrentSeason();
  const chain = season.preseason ? optimism : base;
  const contractAddress = getBuilderNftStarterPackContractAddress(season.start);

  return new ScoutGameStarterPackNFTImplementationClient({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
