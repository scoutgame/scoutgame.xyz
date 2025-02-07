'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { checkSablierAirdropEligibility } from '@packages/blockchain/airdrop/checkSablierAirdropEligibility';
import { authActionClient } from '@packages/nextjs/actions/actionClient';

import { checkAirdropEligibilitySchema } from './checkAirdropEligibilitySchema';

export const checkAirdropEligibilityAction = authActionClient
  .metadata({
    actionName: 'check_airdrop_eligibility'
  })
  .schema(checkAirdropEligibilitySchema)
  .action(async ({ ctx, parsedInput }) => {
    const { payoutId } = parsedInput;

    const payout = await prisma.partnerRewardPayout.findUniqueOrThrow({
      where: {
        id: payoutId,
        wallet: {
          scout: {
            id: ctx.session.scoutId
          }
        }
      },
      select: {
        claimedAt: true,
        wallet: {
          select: {
            address: true
          }
        },
        payoutContract: {
          select: {
            cid: true,
            chainId: true,
            contractAddress: true
          }
        }
      }
    });

    if (payout.claimedAt) {
      throw new Error('Partner reward already claimed');
    }

    const { amount, index, proof } = await checkSablierAirdropEligibility({
      recipientAddress: payout.wallet.address as `0x${string}`,
      cid: payout.payoutContract.cid,
      contractAddress: payout.payoutContract.contractAddress as `0x${string}`,
      chainId: payout.payoutContract.chainId
    });

    return {
      amount,
      index,
      proof
    };
  });
