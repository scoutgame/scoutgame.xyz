import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { getBuilderNftContractAddress } from '../../builderNfts/constants';
import { scoutProtocolChainId } from '../constants';
import { ScoutProtocolNFTImplementationClient } from '../contracts/ScoutProtocolNFTImplementation';

import { getScoutGameNftMinterWallet } from './getScoutGameNftMinterWallet';

export function getNFTReadonlyClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftContractAddress(season);
  if (!contractAddress) {
    throw new Error(`starter pack contract address missing for season ${season}`);
  }

  const builderNFTContract = new ScoutProtocolNFTImplementationClient({
    contractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return builderNFTContract;
}
export function getNFTMinterClient(season = getCurrentSeasonStart()) {
  const contractAddress = getBuilderNftContractAddress(season);
  if (!contractAddress) {
    throw new Error(`starter pack contract address missing for season ${season}`);
  }

  return new ScoutProtocolStarterNFTImplementationClient({
    chain: scoutProtocolChain,
    contractAddress,
    walletClient: getScoutGameNftMinterWallet()
  });
}
