'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';

export const saveDraftTransactionAction = authActionClient
  .metadata({ actionName: 'save-draft-transaction' })
  .schema(
    yup.object().shape({
      user: yup.object().shape({
        id: yup.string().required(),
        walletAddress: yup
          .string()
          .required()
          .test('Valid address', (v) => isAddress(v))
      }),
      transactionInfo: yup.object().shape({
        sourceChainId: yup.number().required(),
        sourceChainTxHash: yup.string().required(),
        decentPayload: yup.object().required()
      }),
      draftInfo: yup.object().shape({
        developerId: yup.string().required(),
        value: yup.string().required(),
        season: yup.string().required()
      })
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session.scoutId;

    if (!userId) {
      throw new Error('User not found');
    }

    // Save the draft transaction
    const data = await prisma.draftSeasonOffer.create({
      data: {
        season: parsedInput.draftInfo.season,
        value: parsedInput.draftInfo.value,
        developerId: parsedInput.draftInfo.developerId,
        createdBy: userId,
        makerWalletAddress: parsedInput.user.walletAddress.toLowerCase(),
        status: 'pending',
        chainId: parsedInput.transactionInfo.sourceChainId,
        decentPayload: parsedInput.transactionInfo.decentPayload,
        txHash: parsedInput.transactionInfo.sourceChainTxHash.toLowerCase()
      }
    });

    scoutgameMintsLogger.info('Saved draft transaction', {
      transactionInfo: parsedInput.transactionInfo,
      draftInfo: parsedInput.draftInfo,
      offerId: data.id,
      userId
    });

    return { id: data.id, txHash: data.txHash };
  });
