import { getBuilderNftContractAddress, builderNftChain } from '../constants';
import { getScoutGameNftMinterWallet } from '../getScoutGameNftMinterWallet';

import { BuilderNFTSeasonOneImplementation01Client } from './builderNFTSeasonOneClient';

// lazily create the client to avoid exceptions if the environment is not configured
export function getBuilderContractMinterClient() {
  const contractAddress = getBuilderNftContractAddress();
  if (!contractAddress) {
    throw new Error('Builder contract address not set');
  }
  return new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
