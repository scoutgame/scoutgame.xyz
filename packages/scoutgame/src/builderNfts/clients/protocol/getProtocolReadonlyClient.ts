import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { getScoutProtocolAddress, scoutProtocolChain } from '../../../protocol/constants';

import { ScoutProtocolImplementationClient } from './wrappers/ScoutProtocolImplementation';
import { ScoutProtocolProxyClient } from './wrappers/ScoutProtocolProxy';

export function getProtocolProxyReadonlyClient() {
  return new ScoutProtocolProxyClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    publicClient: getPublicClient(scoutProtocolChain.id)
  });
}

export function getProtocolReadonlyClient() {
  return new ScoutProtocolImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    publicClient: getPublicClient(scoutProtocolChain.id)
  });
}
