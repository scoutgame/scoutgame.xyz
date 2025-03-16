import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { base } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { ScoutGameSeason01NFTUpgradeableClient } from './wrappers/ScoutGameSeason01NFTUpgradeable';

export function getSeasonOneBuilderNftProxyContractReadonlyClient() {
  const chain = base;
  const contractAddress = getBuilderNftContractAddress('2025-W10');
  return new ScoutGameSeason01NFTUpgradeableClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
