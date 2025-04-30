'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';

import { recordNftMint } from './recordNftMint';
import { validateTransferrableNftMint } from './validateTransferrableNftMint';

export const recordNftMintAction = authActionClient
  .metadata({ actionName: 'record-mint-transaction' })
  .schema(
    yup.object().shape({
      walletAddress: yup.string().required(),
      // .test('Valid address', (v) => isAddress(v))
      txHash: yup.string().required(),
      purchaseInfo: yup.object().shape({
        developerId: yup.string().required(),
        chainId: yup.number().required(),
        contractAddress: yup.string().required(),
        tokenAmount: yup.number().required(),
        tokenId: yup.number().required(),
        quotedPrice: yup.number().required()
      })
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    const { walletAddress, txHash, purchaseInfo } = parsedInput;

    if (!userId) {
      throw new Error('User not found');
    }
    // Fetch the builder NFT
    const builderNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        tokenId: purchaseInfo.tokenId,
        contractAddress: {
          equals: purchaseInfo.contractAddress.toLowerCase(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true
      }
    });

    const scoutWallet = await prisma.scoutWallet.findFirst({
      where: {
        scoutId: userId,
        address: walletAddress.toLowerCase() as `0x${string}`
      }
    });

    if (!scoutWallet) {
      scoutgameMintsLogger.error('Could not find scout wallet for user', {
        userId,
        walletAddress
      });
    }
    const validatedMint = await validateTransferrableNftMint({
      chainId: purchaseInfo.chainId,
      txHash
    });

    if (!validatedMint) {
      scoutgameMintsLogger.error(`Mint transaction failed`, {
        txHash,
        purchaseInfo,
        userId
      });
      throw new Error('Transaction failed');
    }

    // Cron process will handle the tx
    await recordNftMint({
      builderNftId: builderNft.id,
      recipientAddress: walletAddress.toLowerCase() as `0x${string}`,
      scoutId: userId,
      amount: purchaseInfo.tokenAmount,
      tokenValue: purchaseInfo.quotedPrice,
      txLogIndex: validatedMint.txLogIndex,
      txHash
    });
    scoutgameMintsLogger.info('Saved NFT mint transaction', {
      purchaseInfo,
      txHash,
      userId
    });

    return { success: true };
  });
