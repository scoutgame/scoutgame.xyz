'use server';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { claimSablierAirdrop } from '@packages/blockchain/airdrop/claimSablierAirdrop';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import type { Address } from 'viem';
import { optimism, optimismSepolia } from 'viem/chains';
import * as yup from 'yup';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const handlePartnerRewardClaimAction = authActionClient
  .metadata({ actionName: 'handle_partner_reward_claim' })
  .schema(
    yup.object({
      payoutId: yup.string().required()
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
        claimedAt: true,
        payoutContract: {
          select: {
            contractAddress: true,
            chainId: true,
            cid: true
          }
        },
        user: {
          select: {
            wallets: {
              where: {
                primary: true
              },
              select: {
                address: true
              }
            }
          }
        }
      }
    });

    if (payout.claimedAt) {
      throw new Error('Partner reward payout already claimed');
    }

    try {
      const { hash: txHash } = await claimSablierAirdrop({
        chainId: payout.payoutContract.chainId,
        cid: payout.payoutContract.cid,
        contractAddress: payout.payoutContract.contractAddress as Address,
        recipientAddress: payout.user.wallets[0].address as Address
      });

      await prisma.partnerRewardPayout.update({
        where: {
          id: parsedInput.payoutId
        },
        data: {
          claimedAt: new Date(),
          txHash
        }
      });
      return { success: true };
    } catch (error) {
      log.error('Error claiming partner reward payout', { error, userId, payoutId: parsedInput.payoutId });
      throw new Error('Error claiming partner reward payout');
    }
  });
