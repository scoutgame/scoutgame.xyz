import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { base } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { ScoutGameSeason01NFTImplementationClient } from './wrappers/ScoutGameSeason01NFTImplementation';

export function getSeasonOneBuilderNftContractReadonlyClient() {
  const chain = base;
  const contractAddress = getBuilderNftContractAddress('2025-W10');
  return new ScoutGameSeason01NFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
