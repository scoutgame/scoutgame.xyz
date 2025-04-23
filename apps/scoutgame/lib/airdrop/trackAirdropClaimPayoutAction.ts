'use server';

import { log } from '@charmverse/core/log';
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

    const existing = await prisma.airdropClaimPayout.findFirst({
      where: {
        walletAddress: address.toLowerCase(),
        airdropClaimId
      }
    });
    if (existing) {
      log.debug('Airdrop claim payout already exists  ', {
        address,
        airdropClaimId
      });
      return existing;
    }

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
