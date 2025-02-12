'use server';

import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

import { updatePartnerRewardPayout } from './updatePartnerRewardPayout';

export const updatePartnerRewardPayoutAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      payoutContractId: yup.string().required().uuid(),
      txHash: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.scoutId;

    await updatePartnerRewardPayout({
      payoutContractId: parsedInput.payoutContractId,
      txHash: parsedInput.txHash,
      userId
    });

    return { success: true };
  });
