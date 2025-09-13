'use client';

import { checkDecentTransactionAction } from '@packages/scoutgame/builderNfts/checkDecentTransactionAction';
import { nftChain } from '@packages/scoutgame/builderNfts/constants';
import { recordNftMintAction } from '@packages/scoutgame/builderNfts/recordNftMintAction';
import { saveDecentTransactionAction } from '@packages/scoutgame/builderNfts/saveDecentTransactionAction';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { devTokenContractAddress, devTokenDecimalsMultiplier } from '@packages/scoutgame/protocol/constants';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { usePublicClient, useSendTransaction, useWalletClient } from 'wagmi';

import { useRefreshShareImage } from '../hooks/api/builders';

import { useUser } from './UserProvider';

type MintTransactionInput = {
  txData: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
  txMetadata: {
    fromAddress: Address;
    contractAddress: Address;
    sourceChainId: number;
    builderTokenId: number;
    builderId: string;
    purchaseCost: number;
    tokensToBuy: number;
  };
};

type DevNftMintTransactionInput = {
  scoutId: string;
  builderTokenId: number;
  contractAddress: Address;
  tokensToBuy: number;
  isStarterContract: boolean;
  purchaseCost: number;
  fromAddress: Address;
  builderId: string;
};

type PurchaseContext = {
  isExecutingTransaction: boolean;
  purchaseError?: string;
  sendMintTransactionDirectly: (input: DevNftMintTransactionInput) => Promise<any>;
  sendMintTransactionViaDecent: (input: MintTransactionInput) => Promise<unknown>;
  clearPurchaseSuccess: () => void;
  purchaseSuccess: boolean;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { trigger: refreshShareImage } = useRefreshShareImage();
  const { refreshUser } = useUser();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({
    chainId: nftChain.id
  });

  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const {
    isExecuting: isRecordingNftMint,
    result: recordNftMintResult,
    executeAsync: recordNftMint
  } = useAction(recordNftMintAction, {
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error recording NFT mint`, { error, input });
    }
  });

  const {
    isExecuting: isCheckingDecentTransaction,
    result: decentTransactionResult,
    executeAsync: checkDecentTransaction
  } = useAction(checkDecentTransactionAction, {
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error checking Decent transaction`, { error, input });
    }
  });

  const {
    executeAsync: saveDecentTransaction,
    isExecuting: isSavingDecentTransaction,
    result: saveTransactionResult
  } = useAction(saveDecentTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        // Refresh the congrats image without awaiting it since we don't want to slow down the process
        refreshShareImage({ builderId: res.input.developerId });

        const checkResultPromise = checkDecentTransaction({
          pendingTransactionId: res.data.id,
          txHash: res.data.txHash
        });

        toast.promise(
          // reject the promise if there is a server error
          new Promise((resolve, reject) => {
            checkResultPromise
              .then((_res) => {
                if (_res?.serverError) {
                  reject(_res);
                } else {
                  resolve(_res);
                }
              })
              .catch(reject);
          }),
          {
            loading: 'Transaction is being settled...',
            success: () => `Transaction ${res?.data?.txHash || ''} was successful`,
            error: (data) => `Transaction failed: ${data?.serverError?.message || 'Something went wrong'}`
          }
        );

        const checkResult = await checkResultPromise;

        await refreshUser();

        if (checkResult?.serverError) {
          scoutgameMintsLogger.error(`Error checking decent.xyz for transaction`, {
            chainId: res.input.transactionInfo.sourceChainId,
            builderTokenId: res.input.purchaseInfo.tokenId,
            purchaseCost: res.input.purchaseInfo.quotedPrice
          });
        } else if (checkResult?.data?.success) {
          scoutgameMintsLogger.info(`NFT minted`, {
            chainId: res.input.transactionInfo.sourceChainId,
            builderTokenId: res.input.purchaseInfo.tokenId,
            purchaseCost: res.input.purchaseInfo.quotedPrice
          });
        }
      } else {
        scoutgameMintsLogger.warn(`NFT minted but no transaction id returned`, {
          chainId: res.input.transactionInfo.sourceChainId,
          builderTokenId: res.input.purchaseInfo.tokenId,
          purchaseCost: res.input.purchaseInfo.quotedPrice,
          responseData: res.data
        });
      }
    },
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error saving Decent NFT transaction`, {
        chainId: input.transactionInfo.sourceChainId,
        input,
        error
      });
    }
  });

  const sendMintTransactionViaDecent = useCallback(
    async (input: MintTransactionInput) => {
      const {
        txData: { to, data, value: _txValue },
        txMetadata: {
          sourceChainId,
          builderTokenId,
          purchaseCost,
          tokensToBuy,
          fromAddress,
          builderId,
          contractAddress
        }
      } = input;
      return sendTransactionAsync(
        {
          to,
          data,
          value: _txValue
        },
        {
          onSuccess: async (_data) => {
            setPurchaseSuccess(true);
            const output = await saveDecentTransaction({
              developerId: builderId,
              user: {
                walletAddress: fromAddress
              },
              transactionInfo: {
                destinationChainId: nftChain.id,
                sourceChainId,
                sourceChainTxHash: _data
              },
              purchaseInfo: {
                quotedPrice: Number(BigInt(purchaseCost) / devTokenDecimalsMultiplier),
                tokenAmount: tokensToBuy,
                builderContractAddress: contractAddress,
                tokenId: Number(builderTokenId),
                quotedPriceCurrency: devTokenContractAddress
              }
            });

            if (output?.serverError) {
              scoutgameMintsLogger.error(`Saving mint transaction failed`, {});
            } else {
              scoutgameMintsLogger.info(`Successfully sent mint transaction`, { data: _data });
            }
          },
          onError: (err: any) => {
            scoutgameMintsLogger.error(`Creating a mint transaction failed`, {
              txData: input.txData,
              txMetadata: input.txMetadata,
              error: err
            });
          }
        }
      );
    },
    [sendTransactionAsync, saveDecentTransaction]
  );

  const sendMintTransactionDirectly = useCallback(
    async (input: DevNftMintTransactionInput) => {
      const {
        scoutId,
        builderTokenId,
        tokensToBuy,
        purchaseCost,
        isStarterContract,
        contractAddress,
        fromAddress,
        builderId
      } = input;

      if (!walletClient) {
        throw new Error('Wallet client not found');
      }

      if (!publicClient) {
        throw new Error('Public client not found');
      }

      // Refresh the congrats image without awaiting it since we don't want to slow down the process
      refreshShareImage({ builderId });

      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: [
          {
            type: 'function',
            name: 'mint',
            inputs: [
              {
                name: 'account',
                type: 'address'
              },
              {
                name: 'tokenId',
                type: 'uint256'
              },
              {
                name: 'amount',
                type: 'uint256'
              },
              ...(isStarterContract ? [{ name: 'scoutId', type: 'string' }] : [])
            ],
            outputs: []
          }
        ],
        functionName: 'mint',
        args: isStarterContract
          ? [fromAddress, builderTokenId, tokensToBuy, scoutId]
          : [fromAddress, builderTokenId, tokensToBuy]
      });

      const outputPromise = recordNftMint({
        purchaseInfo: {
          chainId: nftChain.id,
          contractAddress,
          developerId: builderId,
          tokenId: builderTokenId,
          tokenAmount: tokensToBuy,
          quotedPrice: Number(BigInt(purchaseCost) / devTokenDecimalsMultiplier)
        },
        txHash,
        walletAddress: fromAddress
      });

      toast.promise(
        // reject the promise if there is a server error
        new Promise((resolve, reject) => {
          outputPromise
            .then((res) => {
              if (res?.serverError) {
                reject(res);
              } else {
                resolve(res);
              }
            })
            .catch(reject);
        }),
        {
          loading: 'Transaction is being settled...',
          success: (output) => `Transaction ${txHash || ''} was successful`,
          error: (data) => data?.serverError?.message || 'Something went wrong'
        }
      );

      const output = await outputPromise;

      if (output?.serverError) {
        scoutgameMintsLogger.error(`Saving mint transaction failed`, {
          builderId,
          contractAddress,
          purchaseCost,
          tokensToBuy,
          txHash
        });
      } else {
        scoutgameMintsLogger.info(`Successfully sent mint transaction`, { data: txHash });
        setPurchaseSuccess(true);

        await refreshUser();
      }
    },
    [walletClient, recordNftMint, publicClient, refreshUser, refreshShareImage]
  );

  const clearPurchaseSuccess = useCallback(() => {
    setPurchaseSuccess(false);
  }, [setPurchaseSuccess]);

  const purchaseError =
    !isCheckingDecentTransaction && !isSavingDecentTransaction && !isRecordingNftMint
      ? decentTransactionResult.serverError?.message ||
        saveTransactionResult.serverError?.message ||
        recordNftMintResult.serverError?.message
      : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction: isSavingDecentTransaction || isCheckingDecentTransaction || isRecordingNftMint,
      purchaseError,
      sendMintTransactionViaDecent,
      clearPurchaseSuccess,
      purchaseSuccess,
      sendMintTransactionDirectly
    }),
    [
      sendMintTransactionDirectly,
      isRecordingNftMint,
      isSavingDecentTransaction,
      sendMintTransactionViaDecent,
      isCheckingDecentTransaction,
      purchaseError,
      clearPurchaseSuccess,
      purchaseSuccess
    ]
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchase() {
  const context = useContext(PurchaseContext);

  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }

  return context;
}
