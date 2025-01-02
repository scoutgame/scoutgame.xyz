import type { Address, Chain } from 'viem';

import { getBuilderNftContractAddress, builderNftChain } from '../constants';
import { getScoutGameNftMinterWallet } from '../getScoutGameNftMinterWallet';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractMinterClient({
  chain = builderNftChain,
  contractAddress = getBuilderNftContractAddress()
}: {
  chain?: Chain;
  contractAddress?: Address;
} = {}) {
  if (!contractAddress) {
    throw new Error('Builder contract address not set');
  }
  return new BuilderNFTSeasonOneImplementation01Client({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
