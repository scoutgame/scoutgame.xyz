import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { BuilderNFTSeasonOneUpgradeableClient } from './wrappers/BuilderNFTSeasonOneUpgradeable';

export function getPreSeasonOneBuilderNftProxyContractReadonlyClient({
  chain = optimism,
  contractAddress = getBuilderNftContractAddress('2024-W41')
}: ClientConfig) {
  return new BuilderNFTSeasonOneUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
