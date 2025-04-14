'use client';

import { saveDraftTransactionAction } from '@packages/scoutgame/drafts/saveDraftTransactionAction';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useSendTransaction } from 'wagmi';

import { useUser } from './UserProvider';

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
    bidAmount: number;
    season: string;
  };
};

type DraftContext = {
  isExecutingTransaction: boolean;
  isSavingDraftTransaction: boolean;
  savedDraftTransaction: boolean;
  transactionHasSucceeded: boolean;
  draftError?: string;
  sendDraftTransaction: (input: DraftTransactionInput) => Promise<unknown>;
  clearDraftSuccess: () => void;
  draftSuccess: boolean;
};

export const DraftContext = createContext<Readonly<DraftContext | null>>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const { refreshUser } = useUser();
  const { sendTransactionAsync } = useSendTransaction();

  const [draftSuccess, setDraftSuccess] = useState(false);

  const {
    executeAsync: saveDraftTransaction,
    isExecuting: isSavingDraftTransaction,
    hasSucceeded: savedDraftTransaction,
    result: saveTransactionResult
  } = useAction(saveDraftTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        toast.success('Draft offer submitted successfully');
        await refreshUser();
      } else {
        scoutgameMintsLogger.warn(`Draft transaction saved but no transaction id returned`, {
          chainId: res.input.transactionInfo.sourceChainId,
          developerId: res.input.draftInfo.developerId,
          value: res.input.draftInfo.value,
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error saving draft transaction`, {
        chainId: input.transactionInfo.sourceChainId,
        input,
        error
      });
    }
  });

  const sendDraftTransaction = useCallback(
    async (input: DraftTransactionInput) => {
      const {
        txData: { to, data, value: _txValue },
        txMetadata: { sourceChainId, developerId, bidAmount, fromAddress, season }
      } = input;
      return sendTransactionAsync(
        {
          to,
          data,
          value: _txValue
        },
        {
          onSuccess: async (_data) => {
            setDraftSuccess(true);
            toast.info('Draft offer is sent and will be confirmed shortly');
            const output = await saveDraftTransaction({
              user: {
                id: developerId,
                walletAddress: fromAddress
              },
              transactionInfo: {
                sourceChainId,
                sourceChainTxHash: _data,
                decentPayload: input.txData
              },
              draftInfo: {
                developerId,
                value: bidAmount.toString(),
                season
              }
            });

            if (output?.serverError) {
              scoutgameMintsLogger.error(`Saving draft transaction failed`, {});
            } else {
              scoutgameMintsLogger.info(`Successfully sent draft transaction`, { data: _data });
            }
          },
          onError: (err: any) => {
            scoutgameMintsLogger.error(`Creating a draft transaction failed`, {
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

  const clearDraftSuccess = useCallback(() => {
    setDraftSuccess(false);
  }, [setDraftSuccess]);

  const draftError = !isSavingDraftTransaction ? saveTransactionResult.serverError?.message : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction: false,
      isSavingDraftTransaction,
      savedDraftTransaction,
      transactionHasSucceeded: savedDraftTransaction,
      draftError,
      sendDraftTransaction,
      clearDraftSuccess,
      draftSuccess
    }),
    [isSavingDraftTransaction, savedDraftTransaction, sendDraftTransaction, draftError, clearDraftSuccess, draftSuccess]
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
