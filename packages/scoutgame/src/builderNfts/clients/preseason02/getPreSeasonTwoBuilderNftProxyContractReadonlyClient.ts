import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { ScoutGamePreSeason02NFTUpgradeableClient } from './wrappers/ScoutGamePreSeason02NFTUpgradeable';

export function getPreSeasonTwoBuilderNftProxyContractReadonlyClient(
  { chain = optimism, contractAddress = getBuilderNftContractAddress('2025-W02') }: ClientConfig = {
    chain: optimism,
    contractAddress: getBuilderNftContractAddress('2025-W02')
  }
) {
  return new ScoutGamePreSeason02NFTUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
