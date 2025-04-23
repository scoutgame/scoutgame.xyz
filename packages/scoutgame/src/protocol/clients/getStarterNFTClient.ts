import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getBuilderNftStarterPackContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';
import { scoutProtocolChain } from '../constants';
import { ScoutProtocolStarterNFTImplementationClient } from '../contracts/ScoutProtocolStarterNFTImplementation';

export function getStarterNFTReadonlyClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftStarterPackContractAddress(season);
  if (!contractAddress) {
    log.warn(`starter pack contract address missing for season ${season}`);
    return null;
  }
  return new ScoutProtocolStarterNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    publicClient: getPublicClient(scoutProtocolChain.id)
  });
}

export function getStarterNFTMinterClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftStarterPackContractAddress(season);
  if (!contractAddress) {
    throw new Error(`starter pack contract address missing for season ${season}`);
  }

  return new ScoutProtocolStarterNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
