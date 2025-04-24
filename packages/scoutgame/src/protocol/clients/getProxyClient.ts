import { getPublicClient } from '@packages/blockchain/getPublicClient';
import type { Address } from 'viem';

import { scoutProtocolChainId } from '../constants';
import { ProxyContract } from '../contracts/ProxyContract';

export function getProxyClient(address: Address) {
  return new ProxyContract({
    contractAddress: address,
    publicClient: getPublicClient(scoutProtocolChainId)
  });
}
