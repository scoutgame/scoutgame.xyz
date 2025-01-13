import { getScoutProtocolAddress, scoutProtocolChain } from '../../../protocol/constants';

import { getProtocolClaimsManagerWallet } from './getProtocolClaimsManagerWallet';
import { ScoutProtocolImplementationClient } from './wrappers/ScoutProtocolImplementation';
import { ScoutProtocolProxyClient } from './wrappers/ScoutProtocolProxy';

export function protocolProxyWriteClient() {
  return new ScoutProtocolProxyClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProtocolClaimsManagerWallet()
  });
}

export function protocolImplementationWriteClient() {
  return new ScoutProtocolImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProtocolClaimsManagerWallet()
  });
}
