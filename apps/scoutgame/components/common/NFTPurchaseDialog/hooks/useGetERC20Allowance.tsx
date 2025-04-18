import { getChainById } from '@packages/blockchain/chains';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWR from 'swr';
import type { Address, Chain } from 'viem';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  owner: Address;
  spender: Address | null;
  erc20Address: Address | null;
  chainId: number;
};

export function useGetERC20Allowance({ owner, spender, erc20Address, chainId }: UseERC20AllowanceProps) {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    error: allowanceError,
    mutate: refreshAllowance
  } = useSWR(
    owner && spender && erc20Address && chainId
      ? `erc20-allowance-${owner}-${spender}-${erc20Address}-${chainId}`
      : null,
    async () => {
      const client = new UsdcErc20ABIClient({
        chain: getChainById(chainId)?.viem as Chain,
        // Shouldn't get triggered unless key is valid
        contractAddress: erc20Address as Address,
        publicClient: getPublicClient(chainId)
      });

      // Spender is not null here since we check for it in the hook
      if (!spender) {
        return BigInt(0);
      }

      const _allowance = await client.allowance({ args: { owner, spender } });

      return _allowance;
    }
  );

  return { allowance, refreshAllowance, isLoadingAllowance, error: allowanceError };
}
