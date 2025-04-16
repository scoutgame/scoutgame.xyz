import { ChainId } from '@decent.xyz/box-common';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import {
  BASE_USDC_ADDRESS,
  DEV_TOKEN_ADDRESS,
  NULL_EVM_ADDRESS,
  OPTIMISM_USDC_ADDRESS
} from '@packages/blockchain/constants';
import type { Address } from 'viem';

export function useGetTokenBalances({ address }: { address: Address }) {
  const result = useUsersBalances({
    chainId: ChainId.BASE,
    selectChains: [ChainId.BASE, ChainId.OPTIMISM],
    address,
    enable: !!address,
    selectTokens: [NULL_EVM_ADDRESS, BASE_USDC_ADDRESS, OPTIMISM_USDC_ADDRESS, DEV_TOKEN_ADDRESS]
  });

  return result;
}
