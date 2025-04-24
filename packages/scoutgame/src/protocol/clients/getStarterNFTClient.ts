import { log } from '@charmverse/core/log';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getBuilderNftStarterPackContractAddress } from '../../builderNfts/constants';
import { scoutProtocolChainId } from '../constants';
import { ScoutProtocolStarterNFTImplementationClient } from '../contracts/ScoutProtocolStarterNFTImplementation';

import { getScoutGameNftMinterWallet } from './getScoutGameNftMinterWallet';

export function getStarterNFTReadonlyClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftStarterPackContractAddress(season);
  if (!contractAddress) {
    log.warn(`starter pack contract address missing for season ${season}`);
    return null;
  }
  return new ScoutProtocolStarterNFTImplementationClient({
    contractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });
}

export function getStarterNFTMinterClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftStarterPackContractAddress(season);
  if (!contractAddress) {
    throw new Error(`starter pack contract address missing for season ${season}`);
  }

  return new ScoutProtocolStarterNFTImplementationClient({
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
