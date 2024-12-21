import { arrayUtils } from '@charmverse/core/utilities';
import { ChainId } from '@decent.xyz/box-common';
import type { UserBalanceArgs } from '@decent.xyz/box-hooks';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import { scoutProtocolChainId, scoutTokenErc20ContractAddress } from '@packages/scoutgame/protocol/constants';
import type { Address } from 'viem';

import { chainOptionsMainnet, ETH_NATIVE_ADDRESS, getChainOptions } from '../components/ChainSelector/chains';

export function useGetTokenBalances({ address, useScoutToken }: { address: Address; useScoutToken?: boolean }) {
  const args: UserBalanceArgs = {
    chainId: ChainId.OPTIMISM,
    selectChains: useScoutToken
      ? [scoutProtocolChainId]
      : arrayUtils.uniqueValues(getChainOptions().map((opt) => opt.id)),
    address,
    enable: !!address,
    selectTokens: useScoutToken
      ? [scoutTokenErc20ContractAddress()]
      : arrayUtils.uniqueValues(
          chainOptionsMainnet
            .map((opt) => {
              if (opt.usdcAddress) {
                return [ETH_NATIVE_ADDRESS, opt.usdcAddress];
              }
              return [ETH_NATIVE_ADDRESS];
            })
            .flat()
        )
  };

  return useUsersBalances(args);
}
