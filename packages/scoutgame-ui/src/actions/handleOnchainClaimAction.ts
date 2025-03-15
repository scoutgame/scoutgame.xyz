'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { getScoutTokenERC20Contract } from '@packages/scoutgame/protocol/constants';
import { revalidatePath } from 'next/cache';
import type { Address } from 'viem';
import * as yup from 'yup';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const handleOnchainClaimAction = authActionClient
  .metadata({ actionName: 'refresh_balance' })
  .schema(
    yup.object({
      wallet: yup.string().required(),
      claimTxHash: yup.string().required(),
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

    const scout = await prisma.scout.findFirst({
      where: {
        id: userId,
        wallets: {
          some: {
            address: parsedInput.wallet.toLowerCase()
          }
        }
      }
    });

    if (!scout) {
      throw new Error('Scout wallet is not connected to the user account');
    }

    await prisma.tokensReceipt.updateMany({
      where: {
        recipientWalletAddress: parsedInput.wallet.toLowerCase(),
        event: {
          week: {
            in: parsedInput.claimsProofs.map((claim) => claim.week)
          }
        }
      },
      data: {
        claimTxHash: parsedInput.claimTxHash,
        claimedAt: new Date()
      }
    });

    // Getting an error "Exponentiation cannot be performed on 'bigint' values unless the 'target' option is set to 'es2016' or later." so using this instead of BigInt(10) ** BigInt(decimals)
    const exponent = Array.from({ length: Number(decimals) }, () => BigInt(10)).reduce(
      (acc, val) => acc * val,
      BigInt(1)
    );
    const currentBalance = Number(balance / exponent);

    await prisma.scout.update({
      where: {
        id: scout.id
      },
      data: {
        currentBalance
      }
    });

    revalidatePath('/claim');

    return { success: true };
  });
