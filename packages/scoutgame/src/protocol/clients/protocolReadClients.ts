import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { scoutProtocolChain, getScoutProtocolAddress, scoutProtocolChainId } from '../constants';

import { ScoutProtocolImplementationClient } from './ScoutProtocolImplementationClient';
import { ScoutProtocolProxyClient } from './ScoutProtocolProxyClient';

export const protocolProxyReadonlyApiClient = new ScoutProtocolProxyClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  publicClient: getPublicClient(scoutProtocolChainId)
});

export const protocolImplementationReadonlyApiClient = new ScoutProtocolImplementationClient({
  chain: scoutProtocolChain,
  contractAddress: getScoutProtocolAddress(),
  publicClient: getPublicClient(scoutProtocolChainId)
});
