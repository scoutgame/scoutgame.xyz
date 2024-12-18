import { getScoutProtocolAddress, scoutProtocolChain } from '../constants';

import { getProxyClaimsManagerWallet } from './getProxyClaimsManagerWallet';
import { ScoutProtocolImplementationClient } from './ScoutProtocolImplementationClient';
import { ScoutProtocolProxyClient } from './ScoutProtocolProxyClient';

export function protocolProxyWriteClient() {
  return new ScoutProtocolProxyClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProxyClaimsManagerWallet()
  });
}

export function protocolImplementationWriteClient() {
  return new ScoutProtocolImplementationClient({
    chain: scoutProtocolChain,
    contractAddress: getScoutProtocolAddress(),
    walletClient: getProxyClaimsManagerWallet()
  });
}
