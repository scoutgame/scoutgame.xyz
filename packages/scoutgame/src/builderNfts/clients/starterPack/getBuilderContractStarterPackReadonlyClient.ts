import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { scoutProtocolChain } from '../../../protocol/constants';
import { getBuilderNftStarterPackContractAddress } from '../../constants';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

export function getBuilderNftStarterPackReadonlyClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftStarterPackContractAddress(season);
  if (!contractAddress) {
    log.warn(`starter pack contract address missing for season ${season}`);
    return null;
  }
  return new ScoutGameStarterPackNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    publicClient: getPublicClient(scoutProtocolChain.id)
  });
}
