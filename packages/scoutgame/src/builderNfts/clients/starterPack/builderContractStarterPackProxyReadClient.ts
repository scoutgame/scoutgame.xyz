import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { builderNftChain, getBuilderNftStarterPackContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { ScoutGameStarterPackNFTImplementationClient } from './wrappers/ScoutGameStarterPackNFTImplementation';

export function getBuilderNftStarterPackReadonlyClient({
  chain = optimism,
  contractAddress = getBuilderNftStarterPackContractAddress()
}: ClientConfig) {
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new ScoutGameStarterPackNFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
