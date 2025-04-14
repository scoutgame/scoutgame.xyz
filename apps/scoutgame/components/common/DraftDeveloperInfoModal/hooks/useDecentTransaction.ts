import { log } from '@charmverse/core/log';
import type { BoxActionRequest } from '@decent.xyz/box-common';
import { ActionType, SwapDirection } from '@decent.xyz/box-common';
import { bigIntToString } from '@packages/utils/numbers';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { prepareDecentTransaction } from '../../NFTPurchaseDialog/hooks/useDecentTransaction';
import { DEV_TOKEN_ADDRESS } from '../components/DraftPaymentOptionSelector';

export const BID_RECIPIENT_ADDRESS = '0x0000000000000000000000000000000000000000';

export type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  paymentAmountOut: bigint;
};

export function useDecentTransaction({
  address,
  paymentAmountOut,
  sourceChainId,
  sourceToken
}: DecentTransactionProps) {
  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: DEV_TOKEN_ADDRESS,
    srcChainId: sourceChainId,
    dstChainId: base.id,
    slippage: 1,
    actionType: ActionType.SwapAction,
    actionConfig: {
      chainId: base.id,
      contractAddress: BID_RECIPIENT_ADDRESS,
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      amount: paymentAmountOut
    }
  };

  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    address && paymentAmountOut
      ? `swap-token-${BID_RECIPIENT_ADDRESS}-${sourceChainId}-${sourceToken}-${paymentAmountOut}`
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
