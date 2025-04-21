import { ChainId } from '@decent.xyz/box-common';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import {
  BASE_USDC_ADDRESS,
  DEV_TOKEN_ADDRESS,
  NULL_EVM_ADDRESS,
  OPTIMISM_USDC_ADDRESS
} from '@packages/blockchain/constants';
import type { Address } from 'viem';

import { useDevTokenBalance } from 'hooks/useDevTokenBalance';

export function useGetTokenBalances({ address }: { address: Address }) {
  const result = useUsersBalances({
    chainId: ChainId.BASE,
    selectChains: [ChainId.BASE, ChainId.OPTIMISM],
    address,
    enable: !!address,
    selectTokens: [NULL_EVM_ADDRESS, BASE_USDC_ADDRESS, OPTIMISM_USDC_ADDRESS]
  });

  // Need to manually add the DEV token balance to the result as it's not included in the result
  const { balance, isLoading } = useDevTokenBalance({
    address
  });

  return {
    tokens: [
      ...(result?.tokens?.map((token) => ({
        address: token.address,
        chainId: token.chainId,
        balance: Number(token.balance) / 10 ** token.decimals
      })) ?? []),
      {
        address: DEV_TOKEN_ADDRESS,
        chainId: ChainId.BASE,
        balance
      }
    ],
    isLoading: result.isLoading || isLoading
  };
}
