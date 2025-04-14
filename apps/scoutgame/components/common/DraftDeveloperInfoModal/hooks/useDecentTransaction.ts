import { log } from '@charmverse/core/log';
import type { BoxActionRequest } from '@decent.xyz/box-common';
import { ActionType, SwapDirection } from '@decent.xyz/box-common';
import useSWR from 'swr';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import { prepareDecentTransaction } from '../../NFTPurchaseDialog/hooks/useDecentTransaction';
import { DEV_TOKEN_ADDRESS } from '../components/DraftPaymentOptionSelector';

// This should be replaced with the actual treasury/escrow contract address that will hold the bids
export const BID_RECIPIENT_ADDRESS = '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d';

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
    dstToken: LINK_TOKEN_ADDRESS,
    srcChainId: sourceChainId,
    dstChainId: base.id,
    slippage: 1,
    actionType: ActionType.SwapAction,
    actionConfig: {
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      amount: paymentAmountOut,
      chainId: base.id,
      receiverAddress: BID_RECIPIENT_ADDRESS
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
