import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { ScoutGamePreSeason02NFTUpgradeableClient } from './wrappers/ScoutGamePreSeason02NFTUpgradeable';

export function getPreSeasonTwoBuilderNftProxyContractReadonlyClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2025-W02');
  return new ScoutGamePreSeason02NFTUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
