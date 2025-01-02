import type { Address, Chain } from 'viem';

import { builderNftChain, getBuilderNftStarterPackContractAddress } from '../constants';
import { getScoutGameNftMinterWallet } from '../getScoutGameNftMinterWallet';

import { BuilderNFTSeasonOneStarterPackImplementationClient } from './BuilderNFTSeasonOneStarterPackImplementationClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractStarterPackMinterClient({
  chain = builderNftChain,
  contractAddress = getBuilderNftStarterPackContractAddress()
}: {
  chain?: Chain;
  contractAddress?: Address;
} = {}) {
  if (!contractAddress) {
    throw new Error('Builder contract starter pack address not set');
  }
  return new BuilderNFTSeasonOneStarterPackImplementationClient({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
