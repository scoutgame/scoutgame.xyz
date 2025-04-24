import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolChainId, devTokenContractAddress } from '../constants';
import { ScoutTokenERC20ImplementationClient } from '../contracts/ScoutTokenERC20Implementation';

export function getScoutTokenERC20Client() {
  const tokenContract = new ScoutTokenERC20ImplementationClient({
    contractAddress: devTokenContractAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });

  return tokenContract;
}
