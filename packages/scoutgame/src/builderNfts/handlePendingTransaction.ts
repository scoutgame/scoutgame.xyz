'use server';

import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma, TransactionStatus } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import {
  DecentTxFailedPermanently,
  waitForDecentTransactionSettlement
} from '@packages/blockchain/waitForDecentTransactionSettlement';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { getPlatform } from '@packages/utils/platform';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import {
  getScoutProtocolBuilderNFTContract,
  scoutProtocolBuilderNftContractAddress,
  scoutTokenDecimalsMultiplier
} from '../protocol/constants';

import { isPreseason01Contract, isStarterPackContract } from './constants';
import { recordNftMint } from './recordNftMint';
import { refreshScoutProtocolBuilderNftPrice } from './refreshScoutProtocolBuilderNftPrice';
import { convertCostToPoints } from './utils';
import { validatePreseason01orStarterPackMint } from './validatePreseason01orStarterPackMint';
import { validateTransferrableNftMint } from './validateTransferrableNftMint';

export async function handlePendingTransaction({
  pendingTransactionId
}: {
  pendingTransactionId: string;
}): Promise<void> {
  if (!stringUtils.isUUID(pendingTransactionId)) {
    throw new InvalidInputError(`Pending transaction id must be a valid uuid`);
  }

  // Atomically set the status to 'processing' only if it's currently 'pending'
  const updatedTx = await prisma.pendingNftTransaction.updateMany({
    where: {
      id: pendingTransactionId,
      status: 'pending'
    },
    data: {
      status: 'processing'
    }
  });

  if (updatedTx.count === 0) {
    scoutgameMintsLogger.info('Skip processing tx as it is locked', { pendingTransactionId });
    // The transaction is already being processed or completed, so exit
    return;
  }

  try {
    // Fetch the pending transaction
    const pendingTx = await prisma.pendingNftTransaction.findUniqueOrThrow({
      where: {
        id: pendingTransactionId
      }
    });

    if (pendingTx.status !== 'processing') {
      scoutgameMintsLogger.info(`Skipping processing for tx id ${pendingTx.id}`);
      return;
    }

    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        tokenId: Number(pendingTx.tokenId),
        contractAddress: {
          equals: pendingTx.contractAddress.toLowerCase(),
          mode: 'insensitive'
        }
      }
    });

    scoutgameMintsLogger.info('Waiting for transaction to settle', {
      sourceTxHash: pendingTx.sourceChainTxHash,
      sourceChainId: pendingTx.sourceChainId,
      contractAddress: pendingTx.contractAddress,
      destinationChainId: pendingTx.destinationChainId
    });
    const txHash =
      pendingTx.destinationChainId === pendingTx.sourceChainId
        ? pendingTx.sourceChainTxHash
        : await waitForDecentTransactionSettlement({
            sourceTxHash: pendingTx.sourceChainTxHash.toLowerCase(),
            sourceTxHashChainId: pendingTx.sourceChainId
          });

    const useScoutIdValidation =
      isPreseason01Contract(pendingTx.contractAddress) || isStarterPackContract(pendingTx.contractAddress);

    scoutgameMintsLogger.info('Transaction settled', { txHash });

    const validatedMint = useScoutIdValidation
      ? await validatePreseason01orStarterPackMint({
          chainId: pendingTx.destinationChainId,
          txHash
        })
      : await validateTransferrableNftMint({
          chainId: pendingTx.destinationChainId,
          txHash
        });

    if (!validatedMint) {
      scoutgameMintsLogger.error(`Transaction on chain ${pendingTx.destinationChainId} failed`, {
        userId: pendingTx.userId
      });
      throw new DecentTxFailedPermanently();
    } else {
      // Update the pending transaction status to 'completed' and set destination details
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.completed,
          destinationChainTxHash: txHash.toLowerCase()
        }
      });

      if (pendingTx.contractAddress.toLowerCase() === scoutProtocolBuilderNftContractAddress()) {
        await refreshScoutProtocolBuilderNftPrice({
          season: getCurrentSeasonStart(),
          builderId: builderNft.builderId
        });

        const balance = await getScoutProtocolBuilderNFTContract().balanceOf({
          args: {
            account: pendingTx.senderAddress as `0x${string}`,
            tokenId: BigInt(pendingTx.tokenId)
          }
        });

        await prisma.scoutNft.upsert({
          where: {
            builderNftId_walletAddress: {
              builderNftId: builderNft.id,
              walletAddress: pendingTx.senderAddress.toLowerCase() as `0x${string}`
            }
          },
          update: {
            balance: Number(balance)
          },
          create: {
            builderNftId: builderNft.id,
            walletAddress: pendingTx.senderAddress.toLowerCase() as `0x${string}`,
            balance: Number(balance)
          }
        });

        log.info('Builder NFT balance', { balance });
      } else {
        await recordNftMint({
          amount: pendingTx.tokenAmount,
          builderNftId: builderNft.id,
          mintTxHash: txHash,
          paidWithPoints: false,
          pointsValue:
            getPlatform() === 'onchain_webapp'
              ? Number(pendingTx.targetAmountReceived / scoutTokenDecimalsMultiplier)
              : convertCostToPoints(pendingTx.targetAmountReceived),
          recipientAddress: pendingTx.senderAddress,
          mintTxLogIndex: validatedMint.txLogIndex
        });
      }
    }
  } catch (error) {
    if (error instanceof DecentTxFailedPermanently) {
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.failed
        }
      });
      throw error; // Rethrow the error after updating the status
    } else {
      // Update the pending transaction status to 'failed'
      await prisma.pendingNftTransaction.update({
        where: {
          id: pendingTransactionId
        },
        data: {
          status: TransactionStatus.pending
        }
      });
      throw error; // Rethrow the error after updating the status
    }
  }
}
