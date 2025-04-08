'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { actionClient } from '@packages/nextjs/actions/actionClient';
import * as yup from 'yup';

export const trackAirdropClaimPayoutAction = actionClient
  .metadata({ actionName: 'track_airdrop_claim_payout' })
  .schema(
    yup.object({
      address: yup.string().required(),
      claimAmount: yup.string().required(),
      airdropClaimId: yup.string().required(),
      donationAmount: yup.string().required(),
      claimTxHash: yup.string().required(),
      donationTxHash: yup.string().nullable()
    })
  )
  .action(async ({ parsedInput }) => {
    const { address, claimAmount, airdropClaimId, donationAmount, claimTxHash, donationTxHash } = parsedInput;

    const payout = await prisma.airdropClaimPayout.create({
      data: {
        walletAddress: address.toLowerCase(),
        airdropClaimId,
        claimAmount,
        donationAmount,
        claimTxHash,
        donationTxHash
      }
    });

    return payout;
  });
