import { log } from '@charmverse/core/log';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import { ActionType, SwapDirection } from '@decent.xyz/box-common';
import type { UseBoxActionArgs } from '@decent.xyz/box-hooks';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import { decentApiKey } from '@packages/utils/constants';
import { GET } from '@packages/utils/http';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { _appendDecentQueryParams } from '../../NFTPurchaseDialog/hooks/useDecentTransaction';

// This should be replaced with the actual treasury/escrow contract address that will hold the bids
export type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  receiverAddress: string;
  amount: bigint;
  enabled: boolean;
};

type ErrorResponse = {
  error: {
    code: number;
    name: string;
    message: string;
    title: string;
  };
  success: boolean;
};

async function prepareDecentV4Transaction({
  txConfig
}: {
  txConfig: BoxActionRequest;
}): Promise<BoxActionResponse | ErrorResponse> {
  const basePath = 'https://box-v4.api.decent.xyz/api/getBoxAction';

  const response = await GET<BoxActionResponse | ErrorResponse>(
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

export function useDecentV4Transaction({
  address,
  amount,
  sourceChainId,
  sourceToken,
  receiverAddress,
  enabled = true
}: DecentTransactionProps) {
  const decentAPIParams: UseBoxActionArgs = {
    sender: address,
    srcToken: sourceToken,
    dstToken: devTokenContractAddress,
    srcChainId: sourceChainId,
    dstChainId: base.id,
    slippage: 1,
    actionType: ActionType.SwapAction,
    actionConfig: {
      amount,
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      receiverAddress,
      chainId: sourceChainId
    }
  };

  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    // Skip Decent SDK call if using DEV tokens or no address
    enabled && address ? `swap-token-${receiverAddress}-${sourceChainId}-${sourceToken}` : null,
    () =>
      prepareDecentV4Transaction({
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
      errorRetryInterval: 2500
    }
  );

  return {
    decentSdkError,
    isLoadingDecentSdk,
    decentTransactionInfo
  };
}
