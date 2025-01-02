import { log } from '@charmverse/core/log';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import { ActionType } from '@decent.xyz/box-common';
import {
  builderNftChain,
  getBuilderNftContractAddress,
  getDecentApiKey,
  optimismUsdcContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import {
  scoutProtocolBuilderNftContractAddress,
  scoutProtocolChainId,
  scoutTokenErc20ContractAddress
} from '@packages/scoutgame/protocol/constants';
import { GET } from '@packages/utils/http';
import { bigIntToString } from '@packages/utils/numbers';
import useSWR from 'swr';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

export type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  paymentAmountOut: bigint;
  builderTokenId: bigint;
  tokensToPurchase: bigint;
  scoutId?: string;
  contractAddress?: string;
  useScoutToken?: boolean;
};

export function _appendDecentQueryParams(path: string, data: any) {
  const queryString = Object.keys(data)
    .filter((key) => !!data[key])
    .map((key) => {
      const value = data[key];
      return Array.isArray(value)
        ? `${value.map((v: string) => `${key}=${v}`).join('&')}`
        : typeof value === 'object'
          ? `${key}=${JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? `${val.toString()}n` : val))}`
          : `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
  return `${path}${queryString ? `?${queryString}` : ''}`;
}

async function prepareDecentTransaction({ txConfig }: { txConfig: BoxActionRequest }): Promise<BoxActionResponse> {
  const DECENT_API_KEY = getDecentApiKey();

  const basePath = 'https://box-v3-2-0.api.decent.xyz/api/getBoxAction';

  const response = await GET<BoxActionResponse>(
    _appendDecentQueryParams(basePath, { arguments: txConfig }),
    undefined,
    {
      headers: {
        'x-api-key': DECENT_API_KEY
      },
      credentials: 'omit'
    }
  );

  return response;
}

export function useDecentTransaction({
  address,
  paymentAmountOut,
  sourceChainId,
  sourceToken,
  builderTokenId,
  scoutId,
  tokensToPurchase,
  contractAddress,
  useScoutToken
}: DecentTransactionProps) {
  const _contractAddress =
    contractAddress || (useScoutToken ? scoutProtocolBuilderNftContractAddress() : getBuilderNftContractAddress());

  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: useScoutToken ? scoutTokenErc20ContractAddress() : optimismUsdcContractAddress,
    srcChainId: sourceChainId,
    dstChainId: useScoutToken ? scoutProtocolChainId : builderNftChain.id,
    slippage: 1,
    actionType: ActionType.NftMint,
    actionConfig: {
      chainId: useScoutToken ? scoutProtocolChainId : optimism.id,
      contractAddress: _contractAddress,
      cost: {
        amount: bigIntToString(paymentAmountOut) as any,
        isNative: false,
        tokenAddress: useScoutToken ? scoutTokenErc20ContractAddress() : optimismUsdcContractAddress
      },
      signature: useScoutToken
        ? 'function mint(address account, uint256 tokenId, uint256 amount)'
        : 'function mint(address account, uint256 tokenId, uint256 amount, string scout)',
      args: useScoutToken
        ? [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase)]
        : [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase), scoutId]
    }
  };
  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    address && paymentAmountOut
      ? `buy-token-${contractAddress}-${_contractAddress}-${builderTokenId}-${tokensToPurchase}-${sourceChainId}-${sourceToken}-${scoutId}-${paymentAmountOut}`
      : null,
    () =>
      prepareDecentTransaction({
        txConfig: decentAPIParams
      }).catch((error) => {
        log.error(`There was an error communicating with Decent API`, { error, decentAPIParams });
        throw error;
      }),
    {
      shouldRetryOnError: (error) => {
        log.info(`Retrying decent tx`, { decentAPIParams, error });
        return true;
      },
      errorRetryInterval: 1000
    }
  );

  return {
    decentSdkError,
    isLoadingDecentSdk,
    decentTransactionInfo
  };
}
