import { log } from '@charmverse/core/log';
import { ActionType, ChainId, SwapDirection } from '@decent.xyz/box-common';
import type { UseBoxActionArgs } from '@decent.xyz/box-hooks';
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
  paymentAmountIn: bigint;
};

export function useDecentTransaction({ address, paymentAmountIn, sourceChainId, sourceToken }: DecentTransactionProps) {
  const decentAPIParams: UseBoxActionArgs = {
    sender: address,
    srcToken: sourceToken,
    dstToken: DEV_TOKEN_ADDRESS,
    srcChainId: sourceChainId,
    dstChainId: base.id,
    slippage: 1,
    actionType: ActionType.SwapAction,
    actionConfig: {
      amount: paymentAmountIn,
      swapDirection: SwapDirection.EXACT_AMOUNT_IN,
      receiverAddress: BID_RECIPIENT_ADDRESS,
      chainId: sourceChainId
    }
  };

  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    address && paymentAmountIn
      ? `swap-token-${BID_RECIPIENT_ADDRESS}-${sourceChainId}-${sourceToken}-${paymentAmountIn}`
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
