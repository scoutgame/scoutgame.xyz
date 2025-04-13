import { base } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';

import { ScoutGameSeason01NFTImplementationClient } from './wrappers/ScoutGameSeason01NFTImplementation';

// lazily create the client to avoid exceptions if the environment is not configured
export function getSeasonOneBuilderNftContractMinterClient() {
  const chain = base;
  const contractAddress = getBuilderNftContractAddress('2025-W18');
  return new ScoutGameSeason01NFTImplementationClient({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
