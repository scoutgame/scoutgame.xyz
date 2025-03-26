import env from '@beam-australia/react-env';
import { Seaport } from '@opensea/seaport-js';
import { getChainById } from '@packages/blockchain/chains';
import type { Eip1193Provider } from 'ethers';
import { JsonRpcProvider, BrowserProvider } from 'ethers';

import { nftChain } from '../builderNfts/constants';

export async function getSeaport() {
  const chain = getChainById(nftChain.id);

  if (!chain) {
    throw new Error('Chain not found');
  }

  if (typeof window !== 'undefined' && 'ethereum' in window) {
    const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
    const signer = await provider.getSigner();
    return new Seaport(signer);
  }

  return new Seaport(new JsonRpcProvider(chain.rpcUrls[0]));
}
