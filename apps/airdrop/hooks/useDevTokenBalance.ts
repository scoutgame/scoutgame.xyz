import { log } from '@charmverse/core/log';
import { SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS } from '@packages/blockchain/constants';
import { useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { readContract } from 'viem/actions';
import { base } from 'viem/chains';
import { usePublicClient, useSwitchChain } from 'wagmi';

export function getCacheKey(address: Address, connectedChainId?: number) {
  return ['tokenBalance', address, connectedChainId];
}

export function useDevTokenBalance({ address }: { address?: Address }) {
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();

  const fetcher = useCallback(
    async (args: [string, Address, undefined | number]) => {
      const [_, _address, connectedChainId] = args;
      if (!_address || !publicClient) {
        return '';
      }

      if (connectedChainId !== base.id) {
        switchChain({ chainId: base.id });
      }

      try {
        // Get token balance
        const tokenBalance = await readContract(publicClient, {
          address: SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [_address]
        });

        // Convert to ETH format (assuming 18 decimals)
        return (Number(tokenBalance) / 1e18).toFixed(2);
      } catch (error) {
        log.error('Error fetching token balance', { _address, connectedChainId, error });
      }
    },
    [publicClient, switchChain]
  );

  const cacheKey = address ? getCacheKey(address, publicClient?.chain?.id) : null;

  const { data: balance = '' } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  function refreshBalance() {
    if (cacheKey) {
      mutate(cacheKey);
    }
  }

  return { balance, refreshBalance };
}
