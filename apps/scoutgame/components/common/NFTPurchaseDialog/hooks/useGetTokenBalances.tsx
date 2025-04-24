import { arrayUtils } from '@charmverse/core/utilities';
import type { UserTokenInfo } from '@decent.xyz/box-common';
import { ChainId } from '@decent.xyz/box-common';
import type { UserBalanceArgs } from '@decent.xyz/box-hooks';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import { NULL_EVM_ADDRESS } from '@packages/blockchain/constants';
import { devTokenContractAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

import { chainOptionsMainnet, getChainOptions } from '../components/ChainSelector/chains';

const erc20Abi = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]);

export function useGetTokenBalances({ address, useScoutToken }: { address: Address; useScoutToken?: boolean }) {
  const [scoutTokenInfo, setScoutTokenInfo] = useState<UserTokenInfo | null>(null);
  const fetchScoutTokenInfoRef = useRef(false);

  // Regular token fetching logic
  const args: UserBalanceArgs = {
    chainId: useScoutToken ? scoutProtocolChainId : ChainId.OPTIMISM,
    selectChains: useScoutToken
      ? [scoutProtocolChainId]
      : arrayUtils.uniqueValues(getChainOptions().map((opt) => opt.id)),
    address,
    enable: !!address,
    selectTokens: arrayUtils.uniqueValues(
      chainOptionsMainnet
        .map((opt) => {
          if (opt.usdcAddress) {
            return [NULL_EVM_ADDRESS, opt.usdcAddress];
          }
          return [NULL_EVM_ADDRESS];
        })
        .flat()
    )
  };

  const result = useUsersBalances(args);

  useEffect(() => {
    async function fetchScoutTokenInfo() {
      try {
        // Create a public client for Base chain
        const client = createPublicClient({
          chain: base,
          transport: http()
        });

        // Fetch token information from the contract
        const [balance, decimals, symbol, name] = await Promise.all([
          client.readContract({
            address: devTokenContractAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address]
          }),
          client.readContract({
            address: devTokenContractAddress,
            abi: erc20Abi,
            functionName: 'decimals'
          }),
          client.readContract({
            address: devTokenContractAddress,
            abi: erc20Abi,
            functionName: 'symbol'
          }),
          client.readContract({
            address: devTokenContractAddress,
            abi: erc20Abi,
            functionName: 'name'
          })
        ]);

        // Calculate the human-readable balance
        const balanceFloat = Number(balance) / 10 ** Number(decimals);

        setScoutTokenInfo({
          address: scoutToken,
          chainId: scoutProtocolChainId,
          name,
          symbol,
          decimals: Number(decimals),
          balance: BigInt(balance.toString()),
          balanceFloat,
          isNative: false,
          logo: '/images/crypto/base64.png'
        });
        fetchScoutTokenInfoRef.current = true;
      } catch (error) {
        return null;
      }
    }

    if (!fetchScoutTokenInfoRef.current && useScoutToken) {
      fetchScoutTokenInfo();
    }
  }, [address, useScoutToken]);

  return {
    ...result,
    tokens: [...(result.tokens ?? []), ...(scoutTokenInfo ? [scoutTokenInfo] : [])]
  };
}
