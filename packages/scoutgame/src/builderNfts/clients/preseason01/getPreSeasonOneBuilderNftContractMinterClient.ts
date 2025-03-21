import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';

import { BuilderNFTSeasonOneImplementation01Client } from './wrappers/BuilderNFTSeasonOneImplementation01';

// lazily create the client to avoid exceptions if the environment is not configured
export function getPreSeasonOneBuilderNftContractMinterClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2024-W41');
  return new BuilderNFTSeasonOneImplementation01Client({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
