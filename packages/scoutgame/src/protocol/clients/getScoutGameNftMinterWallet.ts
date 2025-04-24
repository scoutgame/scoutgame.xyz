import { getWalletClient } from '@packages/blockchain/getWalletClient';

import { scoutProtocolChainId, minterPrivateKey } from '../constants';

export function getScoutGameNftMinterWallet() {
  if (!minterPrivateKey) {
    throw new Error('Builder smart contract owner key not set');
  }
  return getWalletClient({
    chainId: scoutProtocolChainId,
    privateKey: minterPrivateKey
  });
}
