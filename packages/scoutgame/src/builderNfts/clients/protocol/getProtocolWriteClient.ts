import { getPublicClient } from '@packages/blockchain/getPublicClient';

import { getScoutProtocolAddress, scoutProtocolChain } from '../../../protocol/constants';

import { getProtocolClaimsManagerWallet } from './getProtocolClaimsManagerWallet';
import { ScoutProtocolImplementationClient } from './wrappers/ScoutProtocolImplementation';
import { ScoutProtocolProxyClient } from './wrappers/ScoutProtocolProxy';

export function getProtocolProxyWriteClient() {
  return new ScoutProtocolProxyClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProtocolClaimsManagerWallet()
  });
}

export function getProtocolWriteClient() {
  return new ScoutProtocolImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    publicClient: getPublicClient(scoutProtocolChain.id),
    walletClient: getProtocolClaimsManagerWallet()
  });
}
