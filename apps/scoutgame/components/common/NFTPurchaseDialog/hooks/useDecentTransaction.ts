import { log } from '@charmverse/core/log';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import { ActionType } from '@decent.xyz/box-common';
import { devTokenContractAddress, scoutProtocolChainId } from '@packages/scoutgame/protocol/constants';
import { decentApiKey } from '@packages/utils/constants';
import { GET } from '@packages/utils/http';
import { bigIntToString } from '@packages/utils/numbers';
import useSWR from 'swr';
import type { Address } from 'viem';

export type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  paymentAmountOut: bigint;
  builderTokenId: bigint;
  tokensToPurchase: bigint;
  scoutId?: string;
  contractAddress: string;
  isStarterContract: boolean;
};

const transferableNftMintSignature = 'function mint(address account, uint256 tokenId, uint256 amount)';
const transferableStarterNftMintSignature =
  'function mint(address account, uint256 tokenId, uint256 amount, string memory scoutId)';

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

export async function prepareDecentTransaction({
  txConfig
}: {
  txConfig: BoxActionRequest;
}): Promise<BoxActionResponse> {
  const basePath = 'https://box-v3-2-0.api.decent.xyz/api/getBoxAction';

  const response = await GET<BoxActionResponse>(
    _appendDecentQueryParams(basePath, { arguments: txConfig }),
    undefined,
    {
      headers: {
        'x-api-key': decentApiKey
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
  isStarterContract
}: DecentTransactionProps) {
  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: devTokenContractAddress,
    srcChainId: sourceChainId,
    dstChainId: scoutProtocolChainId,
    slippage: 1,
    actionType: ActionType.NftMint,
    actionConfig: {
      chainId: scoutProtocolChainId,
      contractAddress,
      cost: {
        amount: bigIntToString(paymentAmountOut) as any,
        isNative: false,
        tokenAddress: devTokenContractAddress
      },
      signature: isStarterContract ? transferableStarterNftMintSignature : transferableNftMintSignature,
      args: isStarterContract
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
      }).catch((result) => {
        log.error(`There was an error communicating with Decent API`, { error: result, decentAPIParams });
        const message = (result as any).error.message;
        if (message) {
          throw new Error(message);
        }
        throw result;
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
