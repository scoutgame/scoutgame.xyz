import { optimism } from 'viem/chains';

import { getBuilderNftContractAddress } from '../../constants';
import { getScoutGameNftMinterWallet } from '../../getScoutGameNftMinterWallet';

import { ScoutGamePreSeason02NFTImplementationClient } from './wrappers/ScoutGamePreSeason02NFTImplementation';

// lazily create the client to avoid exceptions if the environment is not configured
export function getPreSeasonTwoBuilderNftContractMinterClient() {
  const chain = optimism;
  const contractAddress = getBuilderNftContractAddress('2025-W02');
  return new ScoutGamePreSeason02NFTImplementationClient({
    chain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
