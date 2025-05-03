'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { getScoutTokenERC20Client } from '@packages/scoutgame/protocol/clients/getScoutTokenERC20Client';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { revalidatePath } from 'next/cache';
import { formatUnits, type Address } from 'viem';
import * as yup from 'yup';

// This action needs to be in the scoutgame-ui package because it uses the createUserClaimScreen function which imports components from the scoutgame-ui package
export const handleOnchainClaimAction = authActionClient
  .metadata({ actionName: 'handle_onchain_claim' })
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

    const tokenReceipts = await prisma.tokensReceipt.findMany({
      where: {
        recipientWalletAddress: parsedInput.wallet.toLowerCase(),
        event: {
          week: {
            in: parsedInput.claimsProofs.map((claim) => claim.week)
          }
        }
      },
      select: {
        recipientWallet: {
          select: {
            scoutId: true
          }
        },
        id: true,
        value: true,
        event: {
          select: {
            builderId: true,
            type: true
          }
        }
      }
    });

    let pointsEarnedAsDeveloper = BigInt(0);
    let pointsEarnedAsScout = BigInt(0);

    for (const receipt of tokenReceipts) {
      if (receipt.event.type === 'gems_payout') {
        if (receipt.event.builderId === receipt.recipientWallet?.scoutId) {
          pointsEarnedAsDeveloper += BigInt(receipt.value);
        } else {
          pointsEarnedAsScout += BigInt(receipt.value);
        }
      }
    }

    await prisma.userSeasonStats.update({
      where: {
        userId_season: {
          userId,
          season: getCurrentSeasonStart()
        }
      },
      data: {
        pointsEarnedAsBuilder: {
          increment: Number(formatUnits(pointsEarnedAsDeveloper, devTokenDecimals))
        },
        pointsEarnedAsScout: {
          increment: Number(formatUnits(pointsEarnedAsScout, devTokenDecimals))
        }
      }
    });

    await prisma.tokensReceipt.updateMany({
      where: {
        id: {
          in: tokenReceipts.map((receipt) => receipt.id)
        }
      },
      data: {
        claimTxHash: parsedInput.claimTxHash,
        claimedAt: new Date()
      }
    });

    revalidatePath('/claim');

    return { success: true };
  });
