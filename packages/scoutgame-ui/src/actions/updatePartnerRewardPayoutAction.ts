'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

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

    const payout = await prisma.partnerRewardPayout.findFirstOrThrow({
      where: {
        payoutContractId: parsedInput.payoutContractId,
        wallet: {
          scout: {
            id: userId
          }
        },
        claimedAt: null
      },
      select: {
        claimedAt: true,
        payoutContractId: true
      }
    });

    if (payout.claimedAt) {
      throw new Error('Partner reward payout already claimed');
    }

    await prisma.partnerRewardPayout.updateMany({
      where: {
        payoutContractId: payout.payoutContractId,
        wallet: {
          scout: {
            id: userId
          }
        }
      },
      data: {
        claimedAt: new Date(),
        txHash: parsedInput.txHash
      }
    });
    return { success: true };
  });
