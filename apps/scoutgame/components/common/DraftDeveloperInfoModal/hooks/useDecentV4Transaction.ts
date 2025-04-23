import { log } from '@charmverse/core/log';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import { ActionType, SwapDirection } from '@decent.xyz/box-common';
import type { UseBoxActionArgs } from '@decent.xyz/box-hooks';
import { DRAFT_BID_RECIPIENT_ADDRESS } from '@packages/blockchain/constants';
import { getDecentApiKey } from '@packages/scoutgame/builderNfts/constants';
import { scoutTokenContractAddress } from '@packages/scoutgame/protocol/constants';
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
  const DECENT_API_KEY = getDecentApiKey();

  const basePath = 'https://box-v4.api.decent.xyz/api/getBoxAction';

  const response = await GET<BoxActionResponse | ErrorResponse>(
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

export function useDecentV4Transaction({
  address,
  amount,
  sourceChainId,
  sourceToken,
  enabled = true
}: DecentTransactionProps) {
  const decentAPIParams: UseBoxActionArgs = {
    sender: address,
    srcToken: sourceToken,
    dstToken: scoutTokenContractAddress,
    srcChainId: sourceChainId,
    dstChainId: base.id,
    slippage: 1,
    actionType: ActionType.SwapAction,
    actionConfig: {
      amount,
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      receiverAddress: DRAFT_BID_RECIPIENT_ADDRESS,
      chainId: sourceChainId
    }
  };

  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    // Skip Decent SDK call if using DEV tokens or no address
    enabled && address ? `swap-token-${DRAFT_BID_RECIPIENT_ADDRESS}-${sourceChainId}-${sourceToken}` : null,
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
