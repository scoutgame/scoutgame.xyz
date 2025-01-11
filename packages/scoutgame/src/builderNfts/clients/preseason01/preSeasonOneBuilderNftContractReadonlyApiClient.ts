import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import type { ClientConfig } from '../types';

import { BuilderNFTSeasonOneImplementation01Client } from './wrappers/BuilderNFTSeasonOneImplementation01';

export function getPreSeasonOneBuilderNftContractReadonlyClient({
  chain = optimism,
  contractAddress = getBuilderNftContractAddress('2024-W41')
}: ClientConfig) {
  return new BuilderNFTSeasonOneImplementation01Client({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
