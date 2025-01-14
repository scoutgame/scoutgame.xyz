import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { ScoutGamePreSeason02NFTImplementationClient } from './wrappers/ScoutGamePreSeason02NFTImplementation';

export function getPreSeasonTwoBuilderNftContractReadonlyClient(
  { chain = optimism, contractAddress = getBuilderNftContractAddress('2025-W02') }: ClientConfig = {
    chain: optimism,
    contractAddress: getBuilderNftContractAddress('2025-W02')
  }
) {
  return new ScoutGamePreSeason02NFTImplementationClient({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
