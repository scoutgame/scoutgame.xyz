'use server';

import { log } from '@charmverse/core/log';
import { handlePendingTransaction } from '@packages/scoutgame/handlePendingTransaction';
import { savePendingTransaction } from '@packages/scoutgame/savePendingTransaction';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { authActionClient } from 'lib/actions/actionClient';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const mintNftAction = authActionClient
  .metadata({ actionName: 'mint-nft' })
  .schema(
    yup.object().shape({
      user: yup.object().shape({
        walletAddress: yup
          .string()
          .required()
          .test('Valid address', (v) => isAddress(v))
      }),
      transactionInfo: yup.object().shape({
        sourceChainId: yup.number().required(),
        sourceChainTxHash: yup.string().required(),
        destinationChainId: yup.number().required()
      }),
      purchaseInfo: yup.object().shape({
        builderContractAddress: yup.string().required(),
        tokenAmount: yup.number().required(),
        tokenId: yup.number().required(),
        quotedPrice: yup.number().required(),
        quotedPriceCurrency: yup.string().required()
      })
    })
  )
  .action(async ({ parsedInput }) => {
    const userId = await getUserFromSession().then((u) => u?.id);

    if (!userId) {
      throw new Error('User not found');
    }

    // Cron process will handle the tx
    const data = await savePendingTransaction({
      ...parsedInput,
      user: { ...(parsedInput.user as any), scoutId: userId }
    });

    handlePendingTransaction({ pendingTransactionId: data.id }).catch((error) => {
      log.warn('Couldnt proccess decent transaction in time alotted', { error });
    });

    return { id: data.id };
  });
