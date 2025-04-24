import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolAddress, scoutProtocolChainId } from '../constants';
import { ScoutProtocolImplementationClient } from '../contracts/ScoutProtocolImplementation';

export function getProtocolReadonlyClient() {
  return new ScoutProtocolImplementationClient({
    contractAddress: scoutProtocolAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });
}
