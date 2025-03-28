import { getWalletClient } from '@packages/blockchain/getWalletClient';

import { nftChain, builderSmartContractMinterKey } from './constants';

export function getScoutGameNftMinterWallet() {
  if (!builderSmartContractMinterKey) {
    throw new Error('Builder smart contract owner key not set');
  }
  return getWalletClient({
    chainId: nftChain.id,
    privateKey: builderSmartContractMinterKey
  });
}
