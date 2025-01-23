import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { optimism } from 'viem/chains';

import { getBuilderNftStarterPackContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

export function getBuilderNftStarterPackReadonlyClient({
  chain = optimism,
  contractAddress = getBuilderNftStarterPackContractAddress(getCurrentSeasonStart())
}: ClientConfig = {}) {
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new ScoutGameStarterPackNFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
