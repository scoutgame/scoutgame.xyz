import { log } from '@charmverse/core/log';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import { ActionType } from '@decent.xyz/box-common';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import {
  nftChain,
  getBuilderNftContractAddress,
  getDecentApiKey,
  isPreseason01Contract,
  isStarterNftContract,
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
  contractAddress: string;
  useScoutToken?: boolean;
};

const transferableNftMintSignature = 'function mint(address account, uint256 tokenId, uint256 amount)';

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
    contractAddress ||
    (useScoutToken ? scoutProtocolBuilderNftContractAddress : getBuilderNftContractAddress(getCurrentSeasonStart()));

  const useScoutIdValidation = isPreseason01Contract(_contractAddress) || isStarterNftContract(_contractAddress);

  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: useScoutToken ? scoutTokenErc20ContractAddress() : optimismUsdcContractAddress,
    srcChainId: sourceChainId,
    dstChainId: useScoutToken ? scoutProtocolChainId : nftChain.id,
    slippage: 1,
    actionType: ActionType.NftMint,
    actionConfig: {
      chainId: useScoutToken ? scoutProtocolChainId : optimism.id,
      contractAddress,
      cost: {
        amount: bigIntToString(paymentAmountOut) as any,
        isNative: false,
        tokenAddress: useScoutToken ? scoutTokenErc20ContractAddress() : optimismUsdcContractAddress
      },
      signature: transferableNftMintSignature,
      args: isStarterNftContract(contractAddress)
        ? [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase), scoutId]
        : [address, bigIntToString(builderTokenId), bigIntToString(tokensToPurchase)]
    }
  };
  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    address && paymentAmountOut
      ? `buy-token-${contractAddress}-${builderTokenId}-${tokensToPurchase}-${sourceChainId}-${sourceToken}-${scoutId}-${paymentAmountOut}`
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
