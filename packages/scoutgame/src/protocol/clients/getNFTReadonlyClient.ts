import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolBuilderNftContractAddress, scoutProtocolChainId } from '../constants';
import { ScoutProtocolNFTImplementationClient } from '../contracts/ScoutProtocolNFTImplementation';

export function getScoutProtocolBuilderNFTReadonlyContract() {
  if (!scoutProtocolBuilderNftContractAddress) {
    throw new Error('REACT_APP_BUILDER_NFT_CONTRACT_ADDRESS is not set');
  }

  const builderNFTContract = new ScoutProtocolNFTImplementationClient({
    contractAddress: scoutProtocolBuilderNftContractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return builderNFTContract;
}
