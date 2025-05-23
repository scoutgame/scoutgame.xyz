'use client';

import { checkDraftTransactionAction } from '@packages/scoutgame/drafts/checkDraftTransactionAction';
import { saveDraftTransactionAction } from '@packages/scoutgame/drafts/saveDraftTransactionAction';
import { scoutgameDraftsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { devTokenContractAddress } from '@packages/scoutgame/protocol/constants';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction, useWalletClient } from 'wagmi';

export const MIN_DEV_BID = 100;
export const DRAFT_BID_RECIPIENT_ADDRESS = '0xc5F05D788BC3e5Bc4897FFc54D17d6B17f4E5700';

type DraftTransactionInput = {
  txData: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
  txMetadata: {
    fromAddress: Address;
    sourceChainId: number;
    developerId: string;
    bidAmount: bigint;
  };
};

type SendDevTransactionInput = {
  developerId: string;
  bidAmountInDev: bigint;
  fromAddress: Address;
};

type DraftContext = {
  isExecutingTransaction: boolean;
  isSavingDraftTransaction: boolean;
  draftTransactionSaved: boolean;
  transactionHasSucceeded: boolean;
  draftError?: string;
  sendDraftTransaction: (input: DraftTransactionInput) => Promise<unknown>;
  checkDraftTransaction: (input: { draftOfferId: string }) => Promise<any>;
  sendDevTransaction: (input: SendDevTransactionInput) => Promise<unknown>;
};

export const DraftContext = createContext<Readonly<DraftContext | null>>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();

  const {
    isExecuting: isExecutingTransaction,
    hasSucceeded: transactionHasSucceeded,
    result: transactionResult,
    executeAsync: checkDraftTransaction
  } = useAction(checkDraftTransactionAction, {
    onError({ error, input }) {
      scoutgameDraftsLogger.error(`Error checking draft transaction`, { error, input });
    }
  });

  const {
    executeAsync: saveDraftTransaction,
    isExecuting: isSavingDraftTransaction,
    hasSucceeded: draftTransactionSaved,
    result: saveTransactionResult
  } = useAction(saveDraftTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        const checkResultPromise = checkDraftTransaction({
          draftOfferId: res.data.id
        });

        toast.promise(checkResultPromise, {
          loading: 'Draft transaction is being settled...',
          success: () => `Draft transaction ${res?.data?.txHash || ''} was successful`,
          error: (data) => `Draft transaction failed: ${data?.serverError?.message || 'Something went wrong'}`
        });

        const checkResult = await checkResultPromise;

        if (checkResult?.serverError) {
          scoutgameDraftsLogger.error(`Error checking draft transaction`, {
            chainId: res.input.transactionInfo.sourceChainId,
            developerId: res.input.draftInfo.developerId,
            value: res.input.draftInfo.value
          });
        } else if (checkResult?.data?.success) {
          scoutgameDraftsLogger.info(`Draft transaction completed`, {
            chainId: res.input.transactionInfo.sourceChainId,
            developerId: res.input.draftInfo.developerId,
            value: res.input.draftInfo.value
          });
          toast.success('Draft offer submitted successfully');
        }
      } else {
        scoutgameDraftsLogger.warn(`Draft transaction saved but no transaction id returned`, {
          chainId: res.input.transactionInfo.sourceChainId,
          developerId: res.input.draftInfo.developerId,
          value: res.input.draftInfo.value,
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      scoutgameDraftsLogger.error(`Error saving draft transaction`, {
        chainId: input.transactionInfo.sourceChainId,
        input,
        error
      });
    }
  });

  const sendDevTransaction = useCallback(
    async (input: SendDevTransactionInput) => {
      const { developerId, bidAmountInDev, fromAddress } = input;

      if (!walletClient) {
        throw new Error('Wallet client not found');
      }

      const txHash = await walletClient.writeContract({
        address: devTokenContractAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [DRAFT_BID_RECIPIENT_ADDRESS, bidAmountInDev]
      });
      toast.info('Draft offer is sent and will be confirmed shortly');
      const output = await saveDraftTransaction({
        walletAddress: fromAddress,
        transactionInfo: {
          sourceChainId: base.id,
          sourceChainTxHash: txHash,
          decentPayload: {}
        },
        draftInfo: {
          developerId,
          value: bidAmountInDev.toString()
        }
      });

      if (output?.serverError) {
        scoutgameDraftsLogger.error(`Saving draft transaction failed`, {
          developerId,
          bidAmountInDev,
          fromAddress,
          txHash
        });
      } else {
        scoutgameDraftsLogger.info(`Successfully sent draft transaction`, { data: { txHash } });
      }
    },
    [walletClient, saveDraftTransaction]
  );

  const sendDraftTransaction = useCallback(
    async (input: DraftTransactionInput) => {
      const {
        txData: { to, data, value },
        txMetadata: { sourceChainId, developerId, bidAmount, fromAddress }
      } = input;
      return sendTransactionAsync(
        {
          to,
          data,
          value
        },
        {
          onSuccess: async (_data) => {
            toast.info('Draft offer is sent and will be confirmed shortly');
            const output = await saveDraftTransaction({
              walletAddress: fromAddress,
              transactionInfo: {
                sourceChainId,
                sourceChainTxHash: _data,
                decentPayload: input.txData
              },
              draftInfo: {
                developerId,
                value: bidAmount.toString()
              }
            });

            if (output?.serverError) {
              scoutgameDraftsLogger.error(`Saving draft transaction failed`, { data: _data });
            } else {
              scoutgameDraftsLogger.info(`Successfully sent draft transaction`, { data: _data });
            }
          },
          onError: (err: any) => {
            scoutgameDraftsLogger.error(`Creating a draft transaction failed`, {
              txData: input.txData,
              txMetadata: input.txMetadata,
              error: err
            });
          }
        }
      );
    },
    [sendTransactionAsync, saveDraftTransaction]
  );

  const draftError =
    !isExecutingTransaction && !isSavingDraftTransaction
      ? (transactionResult.serverError?.message ?? saveTransactionResult.serverError?.message)
      : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      isSavingDraftTransaction,
      draftTransactionSaved,
      transactionHasSucceeded,
      draftError,
      sendDraftTransaction,
      checkDraftTransaction,
      sendDevTransaction
    }),
    [
      isExecutingTransaction,
      isSavingDraftTransaction,
      draftTransactionSaved,
      transactionHasSucceeded,
      sendDraftTransaction,
      draftError,
      checkDraftTransaction,
      sendDevTransaction
    ]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const context = useContext(DraftContext);

  if (!context) {
    throw new Error('useDraft must be used within a DraftProvider');
  }

  return context;
}
