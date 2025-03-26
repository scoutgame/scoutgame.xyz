import env from '@beam-australia/react-env';
import { Seaport } from '@opensea/seaport-js';
import { getChainById } from '@packages/blockchain/chains';
import { JsonRpcProvider } from 'ethers';

import { nftChain } from '../builderNfts/constants';

export async function getSeaport() {
  const chain = getChainById(nftChain.id);

  if (!chain) {
    throw new Error('Chain not found');
  }

  const ankrApiId = env('ANKR_API_ID') || process.env.REACT_APP_ANKR_API_ID;

  if (chain.chainName === 'Optimism') {
    if (!ankrApiId) {
      throw new Error('ANKR_API_ID is not set');
    }

    const rpcUrl = chain.rpcUrls[0];

    const provider = new JsonRpcProvider(`${rpcUrl}/${ankrApiId}`, {
      name: chain.chainName,
      chainId: chain.chainId
    });
    return new Seaport(provider);
  }

  const rpcUrl = getChainById(nftChain.id)?.rpcUrls[0] as string;
  const provider = new JsonRpcProvider(rpcUrl, {
    name: chain.chainName,
    chainId: chain.chainId
  });
  return new Seaport(provider);
}
