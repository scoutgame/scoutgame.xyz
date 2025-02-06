'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const updatePartnerRewardPayoutAction = authActionClient
  .metadata({ actionName: 'update_partner_reward_payout' })
  .schema(
    yup.object({
      payoutId: yup.string().required(),
      txHash: yup.string().required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.scoutId;

    const payout = await prisma.partnerRewardPayout.findUniqueOrThrow({
      where: {
        id: parsedInput.payoutId,
        userId,
        claimedAt: null
      },
      select: {
        claimedAt: true
      }
    });

    if (payout.claimedAt) {
      throw new Error('Partner reward payout already claimed');
    }

    await prisma.partnerRewardPayout.update({
      where: {
        id: parsedInput.payoutId
      },
      data: {
        claimedAt: new Date(),
        txHash: parsedInput.txHash
      }
    });
    return { success: true };
  });
