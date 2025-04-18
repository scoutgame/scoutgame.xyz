'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { scoutgameDraftsLogger } from '../loggers/mintsLogger';

import { isDraftEnabled } from './checkDraftDates';

export const saveDraftTransactionAction = authActionClient
  .metadata({ actionName: 'save-draft-transaction' })
  .schema(
    yup.object().shape({
      walletAddress: yup
        .string()
        .required()
        .test('Valid address', (v) => isAddress(v)),
      transactionInfo: yup.object().shape({
        sourceChainId: yup.number().required(),
        sourceChainTxHash: yup.string().required(),
        decentPayload: yup.object().required()
      }),
      draftInfo: yup.object().shape({
        developerId: yup.string().required(),
        value: yup.string().required()
      })
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const draftEnabled = isDraftEnabled();

    if (!draftEnabled) {
      throw new Error('Draft is not enabled');
    }

    const userId = ctx.session.scoutId;

    if (!userId) {
      throw new Error('User not found');
    }

    const walletAddress = parsedInput.walletAddress.toLowerCase();

    // Throw an error if the wallet address doesn't belong to the current user
    const scoutWallet = await prisma.scoutWallet.findUnique({
      where: {
        address: walletAddress
      },
      select: {
        scoutId: true
      }
    });

    if (!scoutWallet) {
      await prisma.scoutWallet.create({
        data: {
          address: walletAddress,
          scoutId: userId
        }
      });
    } else if (scoutWallet.scoutId !== userId) {
      throw new Error('Wallet address does not belong to the current user');
    }

    const txHash = parsedInput.transactionInfo.sourceChainTxHash.toLowerCase();

    // Save the draft transaction
    const data = await prisma.draftSeasonOffer.create({
      data: {
        season: getCurrentSeasonStart(),
        value: parsedInput.draftInfo.value,
        developerId: parsedInput.draftInfo.developerId,
        createdBy: userId,
        makerWalletAddress: walletAddress,
        status: 'pending',
        sourceChainId: parsedInput.transactionInfo.sourceChainId,
        decentPayload: parsedInput.transactionInfo.decentPayload,
        decentTxHash: txHash
      }
    });

    scoutgameDraftsLogger.info('Saved draft transaction', {
      transactionInfo: parsedInput.transactionInfo,
      draftInfo: parsedInput.draftInfo,
      offerId: data.id,
      userId
    });

    trackUserAction('draft_developer', {
      amount: Number(parsedInput.draftInfo.value),
      developerId: parsedInput.draftInfo.developerId,
      chainId: parsedInput.transactionInfo.sourceChainId,
      userId
    });

    return { id: data.id, txHash };
  });
