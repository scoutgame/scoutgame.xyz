import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftStarterPackContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { ScoutGameStarterPackNFTUpgradeableClient } from './wrappers/ScoutGameStarterPackNFTUpgradeable';

export function getBuilderNftStarterPackProxyReadonlyClient({
  chain = optimism,
  contractAddress = getBuilderNftStarterPackContractAddress()
}: ClientConfig) {
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new ScoutGameStarterPackNFTUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
