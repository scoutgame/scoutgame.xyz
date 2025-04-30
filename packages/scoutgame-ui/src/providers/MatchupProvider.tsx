'use client';

import { log } from '@charmverse/core/log';
import { checkMatchupTransactionAction } from '@packages/matchup/checkMatchupTransactionAction';
import { registerForMatchupAction } from '@packages/matchup/registerForMatchupAction';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction, useWalletClient } from 'wagmi';

type DecentTransactionInput = {
  matchupWeek: string;
  txData: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
  txMetadata: {
    fromAddress: Address;
    sourceChainId: number;
    sourceToken: string;
  };
};

type DirectTransactionInput = {
  matchupWeek: string;
  fromAddress: Address;
  toAddress: Address;
  tokenAmount: bigint;
  tokenAddress: Address;
};

type MatchupContext = {
  isExecutingTransaction: boolean;
  error?: string;
  sendTransactionViaDecent: (input: DecentTransactionInput) => Promise<unknown>;
  sendDirectTransaction: (input: DirectTransactionInput) => Promise<unknown>;
};

export const MatchupContext = createContext<Readonly<MatchupContext | null>>(null);

export function MatchupProvider({ children }: { children: ReactNode }) {
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();

  const {
    isExecuting: isCheckingTransaction,
    result: transactionCheckResult,
    executeAsync: checkTransactionResult
  } = useAction(checkMatchupTransactionAction, {
    onError({ error, input }) {
      log.error(`Error checking matchup transaction`, { error, input });
    }
  });

  const {
    executeAsync: saveMatchupRegistration,
    isExecuting: isSavingTransaction,
    result: saveTransactionResult
  } = useAction(registerForMatchupAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        const checkResultPromise = checkTransactionResult({
          matchupId: res.data.id
        });

        toast.promise(checkResultPromise, {
          loading: 'Transaction is being settled...',
          success: () => `Transaction ${res?.data?.decentTxHash || ''} was successful`,
          error: (data) => `Transaction failed: ${data?.serverError?.message || 'Something went wrong'}`
        });

        const checkResult = await checkResultPromise;

        if (checkResult?.serverError) {
          log.error(`Error checking matchup transaction`, {
            checkResult
          });
        } else if (checkResult?.data?.success) {
          log.info(`Matchup transaction completed`, {
            checkResult
          });
          toast.success('Matchup offer submitted successfully');
        }
      } else {
        log.warn(`Matchup transaction saved but no transaction id returned`, {
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      log.error(`Error saving matchup transaction`, {
        // chainId: input.transactionInfo.sourceChainId,
        input,
        error
      });
    }
  });

  const sendDirectTransaction = useCallback(
    async (input: DirectTransactionInput) => {
      const { toAddress, tokenAmount, tokenAddress, fromAddress, matchupWeek } = input;

      if (!walletClient) {
        throw new Error('Wallet client not found');
      }

      const txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [toAddress, tokenAmount]
      });
      await saveMatchupRegistration({
        week: matchupWeek,
        tx: { chainId: base.id, hash: txHash }
      });
    },
    [saveMatchupRegistration, walletClient]
  );

  const sendTransactionViaDecent = useCallback(
    async (input: DecentTransactionInput) => {
      const {
        txData: { to, data, value },
        txMetadata: { sourceChainId, fromAddress },
        matchupWeek
      } = input;
      return sendTransactionAsync(
        {
          to,
          data,
          value
        },
        {
          onSuccess: async (_data) => {
            await saveMatchupRegistration({
              week: matchupWeek,
              decentTx: {
                chainId: sourceChainId,
                hash: _data
              }
            });
          },
          onError: (err: any) => {
            log.error(`Creating a matchup transaction failed`, {
              txData: input.txData,
              txMetadata: input.txMetadata,
              error: err
            });
          }
        }
      );
    },
    [sendTransactionAsync, saveMatchupRegistration]
  );

  const error =
    !isCheckingTransaction && !isSavingTransaction
      ? (transactionCheckResult.serverError?.message ?? saveTransactionResult.serverError?.message)
      : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction: isSavingTransaction,
      error,
      sendTransactionViaDecent,
      sendDirectTransaction
    }),
    [isSavingTransaction, sendTransactionViaDecent, error, sendDirectTransaction]
  );

  return <MatchupContext.Provider value={value}>{children}</MatchupContext.Provider>;
}

export function useMatchup() {
  const context = useContext(MatchupContext);

  if (!context) {
    throw new Error('useMatchup must be used within a MatchupProvider');
  }

  return context;
}
