import { useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { readContract } from 'viem/actions';
import { useAccount, usePublicClient } from 'wagmi';

const TOKEN_ADDRESS = '0xfcdc6813a75df7eff31382cb956c1bee4788dd34';

export function useTokenBalance() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [balance, setBalance] = useState('0');

  const fetchTokenBalance = async () => {
    if (!address || !publicClient) return;

    try {
      // Get token balance
      const tokenBalance = await readContract(publicClient, {
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address]
      });

      // Convert to ETH format (assuming 18 decimals)
      const formattedBalance = (Number(tokenBalance) / 1e18).toFixed(2);
      setBalance(formattedBalance);
    } catch (error) {
      // Error handling without console statement
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
