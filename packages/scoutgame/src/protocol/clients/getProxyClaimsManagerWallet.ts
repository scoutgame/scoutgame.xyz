import { getWalletClient } from '@packages/blockchain/getWalletClient';

import { scoutProtocolChainId } from '../constants';

export function getProxyClaimsManagerWallet() {
  const scoutProtocolClaimsManagerKey = process.env.SCOUTPROTOCOL_CLAIMS_MANAGER_PRIVKEY as string;

  return getWalletClient({
    chainId: scoutProtocolChainId,
    privateKey: scoutProtocolClaimsManagerKey
  });
}
