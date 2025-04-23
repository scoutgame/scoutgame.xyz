import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolAddress, scoutProtocolChainId } from '../constants';
import { ScoutProtocolImplementationClient } from '../contracts/ScoutProtocolImplementation';
import { ScoutProtocolProxyClient } from '../contracts/ScoutProtocolProxy';

export function getProtocolReadonlyClient() {
  return new ScoutProtocolImplementationClient({
    contractAddress: scoutProtocolAddress,
    publicClient: getPublicClient(scoutProtocolChainId)
  });
}
