import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { BuilderNFTSeasonOneUpgradeableClient } from './wrappers/BuilderNFTSeasonOneUpgradeable';

export function getPreSeasonOneBuilderNftProxyContractReadonlyClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2024-W41')!;
  return new BuilderNFTSeasonOneUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
