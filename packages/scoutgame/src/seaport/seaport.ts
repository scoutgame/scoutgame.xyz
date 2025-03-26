import { Seaport } from '@opensea/seaport-js';
import type { ethers } from 'ethers';

export async function getSeaport(signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider) {
  return new Seaport(signerOrProvider);
}
