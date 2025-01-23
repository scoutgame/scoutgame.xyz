import { getCurrentSeasonStart } from '@packages/dates/utils';
import { optimism } from 'viem/chains';

import { getBuilderNftStarterPackContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';
import type { ClientConfig } from '../types';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderNftContractStarterPackMinterClient({
  chain = optimism,
  contractAddress = getBuilderNftStarterPackContractAddress(getCurrentSeasonStart())
}: ClientConfig = {}) {
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new ScoutGameStarterPackNFTImplementationClient({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
