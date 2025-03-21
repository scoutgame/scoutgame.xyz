import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';

import { BuilderNFTSeasonOneImplementation01Client } from './wrappers/BuilderNFTSeasonOneImplementation01';

export function getPreSeasonOneBuilderNftContractReadonlyClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2024-W41');
  return new BuilderNFTSeasonOneImplementation01Client({
    chain,
    contractAddress,
    publicClient: getPublicClient(chain.id)
  });
}
