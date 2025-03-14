import { getPublicClient } from '@packages/blockchain/getPublicClient';

import type { ClientConfig } from '../types';

import { ScoutGameStarterPackNFTUpgradeableClient } from './wrappers/ScoutGameStarterPackNFTUpgradeable';

export function getBuilderNftStarterPackProxyReadonlyClient({ chain, contractAddress }: Required<ClientConfig>) {
  return new ScoutGameStarterPackNFTUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
