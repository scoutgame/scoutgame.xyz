import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeason } from '@packages/dates/utils';

import { scoutProtocolChain } from '../../../protocol/constants';
import { getBuilderNftStarterPackContractAddress } from '../../constants';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

export function getBuilderNftStarterPackReadonlyClient() {
  const season = getCurrentSeason();
  const contractAddress = getBuilderNftStarterPackContractAddress(season.start);
  return new ScoutGameStarterPackNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    publicClient: getPublicClient(scoutProtocolChain.id)
  });
}
