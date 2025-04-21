import { getCurrentSeason } from '@packages/dates/utils';

import { scoutProtocolChain } from '../../../protocol/constants';
import { getBuilderNftStarterPackContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderNftContractStarterPackMinterClient() {
  const season = getCurrentSeason();
  const contractAddress = getBuilderNftStarterPackContractAddress(season.start);
  if (!contractAddress) {
    throw new Error(`starter pack contract address missing for season ${season.start}`);
  }

  return new ScoutGameStarterPackNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
