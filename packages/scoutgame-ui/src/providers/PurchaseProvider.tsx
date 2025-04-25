'use client';

import { checkDecentTransactionAction } from '@packages/scoutgame/builderNfts/checkDecentTransactionAction';
import { nftChain } from '@packages/scoutgame/builderNfts/constants';
import { saveDecentTransactionAction } from '@packages/scoutgame/builderNfts/saveDecentTransactionAction';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import { devTokenContractAddress, devTokenDecimalsMultiplier } from '@packages/scoutgame/protocol/constants';
import { useAction } from 'next-safe-action/hooks';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useSendTransaction, useWalletClient } from 'wagmi';

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
  isSavingDecentTransaction: boolean;
  savedDecentTransaction: boolean;
  transactionHasSucceeded: boolean;
  checkDecentTransaction: (input: { pendingTransactionId: string; txHash: string }) => Promise<any>;
  purchaseError?: string;
  sendNftMintTransaction: (input: MintTransactionInput) => Promise<unknown>;
  clearPurchaseSuccess: () => void;
  purchaseSuccess: boolean;
  sendDevNftMintTransaction: (input: DevNftMintTransactionInput) => Promise<any>;
};

export const PurchaseContext = createContext<Readonly<PurchaseContext | null>>(null);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { trigger: refreshShareImage } = useRefreshShareImage();
  const { refreshUser } = useUser();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();

  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const {
    isExecuting: isExecutingTransaction,
    hasSucceeded: transactionHasSucceeded,
    result: transactionResult,
    executeAsync: checkDecentTransaction
  } = useAction(checkDecentTransactionAction, {
    onError({ error, input }) {
      scoutgameMintsLogger.error(`Error checking Decent transaction`, { error, input });
    }
  });

  const {
    executeAsync: saveDecentTransaction,
    isExecuting: isSavingDecentTransaction,
    hasSucceeded: savedDecentTransaction,
    result: saveTransactionResult
  } = useAction(saveDecentTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        // Refresh the congrats image without awaiting it since we don't want to slow down the process
        refreshShareImage({ builderId: res.input.user.id });

        const checkResultPromise = checkDecentTransaction({
          pendingTransactionId: res.data.id,
          txHash: res.data.txHash
        });

        toast.promise(checkResultPromise, {
          loading: 'Transaction is being settled...',
          success: () => `Transaction ${res?.data?.txHash || ''} was successful`,
          error: (data) => `Transaction failed: ${data?.serverError?.message || 'Something went wrong'}`
        });

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

  const sendDevNftMintTransaction = useCallback(async (input: DevNftMintTransactionInput) => {
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

    toast.info('NFT purchase is sent and will be confirmed shortly');

    const output = await saveDecentTransaction({
      purchaseInfo: {
        builderContractAddress: contractAddress,
        tokenId: builderTokenId,
        tokenAmount: tokensToBuy,
        quotedPrice: Number(BigInt(purchaseCost) / devTokenDecimalsMultiplier),
        quotedPriceCurrency: devTokenContractAddress
      },
      transactionInfo: {
        sourceChainId: 8453,
        sourceChainTxHash: txHash,
        destinationChainId: 8453
      },
      user: {
        id: builderId,
        walletAddress: fromAddress
      }
    });

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
    }
  }, []);

  const sendNftMintTransaction = useCallback(
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
            toast.info('NFT purchase is sent and will be confirmed shortly');
            const output = await saveDecentTransaction({
              user: {
                id: builderId,
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

  const clearPurchaseSuccess = useCallback(() => {
    setPurchaseSuccess(false);
  }, [setPurchaseSuccess]);

  const purchaseError =
    !isExecutingTransaction && !isSavingDecentTransaction
      ? transactionResult.serverError?.message || saveTransactionResult.serverError?.message
      : undefined;

  const value = useMemo(
    () => ({
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      purchaseError,
      sendNftMintTransaction,
      savedDecentTransaction,
      isSavingDecentTransaction,
      clearPurchaseSuccess,
      purchaseSuccess,
      sendDevNftMintTransaction
    }),
    [
      isExecutingTransaction,
      transactionHasSucceeded,
      checkDecentTransaction,
      sendNftMintTransaction,
      savedDecentTransaction,
      isSavingDecentTransaction,
      purchaseError,
      clearPurchaseSuccess,
      purchaseSuccess,
      sendDevNftMintTransaction
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
