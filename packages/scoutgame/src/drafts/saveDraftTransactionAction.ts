'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { trackUserAction } from '@packages/mixpanel/trackUserAction';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { DateTime } from 'luxon';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { scoutgameDraftsLogger } from '../loggers/mintsLogger';

const DRAFT_END_DATE = DateTime.fromISO('2025-04-25T23:59:59.999Z', { zone: 'utc' });

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
        value: yup.string().required()
      })
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const nowUtc = DateTime.utc();
    if (nowUtc > DRAFT_END_DATE) {
      throw new Error('Draft has ended');
    }

    const userId = ctx.session.scoutId;

    if (!userId) {
      throw new Error('User not found');
    }

    const txHash = parsedInput.transactionInfo.sourceChainTxHash.toLowerCase();

    // Save the draft transaction
    const data = await prisma.draftSeasonOffer.create({
      data: {
        season: getCurrentSeasonStart(),
        value: parsedInput.draftInfo.value,
        developerId: parsedInput.draftInfo.developerId,
        createdBy: userId,
        makerWalletAddress: parsedInput.user.walletAddress.toLowerCase(),
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
