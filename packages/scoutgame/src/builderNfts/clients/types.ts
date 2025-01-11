import type { Address, Chain } from 'viem';

export type ClientConfig = {
  chain?: Chain;
  contractAddress?: Address;
};
