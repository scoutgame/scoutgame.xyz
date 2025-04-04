'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

export const trackAirdropClaimPayoutAction = actionClient
  .metadata({ actionName: 'track_airdrop_claim_payout' })
  .schema(
    yup.object({
      address: yup.string().required(),
      amount: yup.string().required(),
      airdropClaimId: yup.string().required(),
      donationAmount: yup.string().required(),
      txHash: yup.string().required()
    })
  )
  .action(async ({ parsedInput }) => {
    const { address, amount, airdropClaimId, donationAmount, txHash } = parsedInput;

    const payout = await prisma.airdropClaimPayout.create({
      data: {
        walletAddress: address.toLowerCase(),
        airdropClaimId,
        amount,
        donationAmount,
        txHash
      }
    });

    return payout;
  });
