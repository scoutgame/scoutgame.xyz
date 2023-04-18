import type { GitcoinChainId } from 'lib/gitcoin/interfaces';

export const GITCOIN_SUPPORTED_CHAINS = [1, 5, 10, 250] as const;

export const PROJECT_REGISTRY_ADDRESSES: Record<GitcoinChainId, string> = {
  // MAINNET
  1: '0x03506eD3f57892C85DB20C36846e9c808aFe9ef4',
  // OPTIMISM
  10: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
  // FANTOM
  250: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
  // GOERLI
  5: '0x832c5391dc7931312CbdBc1046669c9c3A4A28d5'
};
