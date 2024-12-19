'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/scoutgame/actions/actionClient';
import { getScoutTokenERC20Contract } from '@packages/scoutgame/protocol/constants';
import type { Address } from 'viem';
import * as yup from 'yup';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const handleOnchainClaimAction = authActionClient
  .metadata({ actionName: 'refresh_balance' })
  .schema(
    yup.object({
      wallet: yup.string().required(),
      claimsProofs: yup
        .array(
          yup.object({
            week: yup.string().required(),
            amount: yup.number().required(),
            proofs: yup.array(yup.string().required()).required()
          })
        )
        .required()
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const userId = ctx.session.scoutId;

    const balance = await getScoutTokenERC20Contract().balanceOf({ args: { account: parsedInput.wallet as Address } });

    const decimals = await getScoutTokenERC20Contract().decimals();

    const scout = await prisma.scout.findFirstOrThrow({
      where: {
        id: userId,
        wallets: {
          some: {
            address: parsedInput.wallet.toLowerCase()
          }
        }
      }
    });

    await prisma.tokensReceipt.updateMany({
      where: {
        walletAddress: parsedInput.wallet.toLowerCase(),
        event: {
          week: {
            in: parsedInput.claimsProofs.map((claim) => claim.week)
          }
        }
      },
      data: {
        claimedAt: new Date()
      }
    });

    await prisma.scout.update({
      where: {
        id: scout.id
      },
      data: {
        currentBalance: Number(balance / BigInt(10) ** decimals)
      }
    });

    return { success: true };
  });
