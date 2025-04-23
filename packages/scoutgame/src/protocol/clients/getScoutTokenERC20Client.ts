import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolChainId, scoutTokenContractAddress } from '../constants';
import { ScoutTokenERC20ImplementationClient } from '../contracts/ScoutTokenERC20Implementation';

export function getScoutTokenERC20Client() {
  const tokenContract = new ScoutTokenERC20ImplementationClient({
    contractAddress: scoutTokenContractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return tokenContract;
}
