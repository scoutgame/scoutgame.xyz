import { SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS } from '@packages/blockchain/constants';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { readContract } from 'viem/actions';
import { base } from 'viem/chains';
import { usePublicClient, useSwitchChain } from 'wagmi';

export function useDevTokenBalance({ address }: { address?: Address }) {
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState('0');
  const { switchChain } = useSwitchChain();

  const fetchTokenBalance = async () => {
    if (!address || !publicClient) return;

    if (publicClient.chain.id !== base.id) {
      switchChain({ chainId: base.id });
    }

    try {
      // Get token balance
      const tokenBalance = await readContract(publicClient, {
        address: SCOUT_TOKEN_ERC20_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address]
      });

      // Convert to ETH format (assuming 18 decimals)
      const formattedBalance = (Number(tokenBalance) / 1e18).toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      setBalance('0');
    }
  };

  useEffect(() => {
    if (address) {
      fetchTokenBalance();
    } else {
      setBalance('0');
    }
  }, [address]);

  return { balance };
}
