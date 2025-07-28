'use server';

import { prisma } from '@charmverse/core/prisma-client';
import { authActionClient } from '@packages/nextjs/actions/actionClient';
import { devTokenDecimals } from '@packages/scoutgame/protocol/constants';
import { revalidatePath } from 'next/cache';
import { formatUnits } from 'viem';
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
            amount: yup.string().required(),
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
            type: true,
            season: true
          }
        }
      }
    });

    // Group points by season
    const pointsBySeason = new Map<string, { pointsEarnedAsDeveloper: bigint; pointsEarnedAsScout: bigint }>();

    for (const receipt of tokenReceipts) {
      if (receipt.event.type === 'gems_payout') {
        const season = receipt.event.season;

        if (!pointsBySeason.has(season)) {
          pointsBySeason.set(season, { pointsEarnedAsDeveloper: BigInt(0), pointsEarnedAsScout: BigInt(0) });
        }

        const seasonPoints = pointsBySeason.get(season)!;

        if (receipt.event.builderId === receipt.recipientWallet?.scoutId) {
          seasonPoints.pointsEarnedAsDeveloper += BigInt(receipt.value);
        } else {
          seasonPoints.pointsEarnedAsScout += BigInt(receipt.value);
        }
      }
    }

    // Update user season stats for each season
    for (const [season, points] of pointsBySeason) {
      const pointsEarnedAsDeveloperNumber = Number(formatUnits(points.pointsEarnedAsDeveloper, devTokenDecimals));
      const pointsEarnedAsScoutNumber = Number(formatUnits(points.pointsEarnedAsScout, devTokenDecimals));

      await prisma.userSeasonStats.upsert({
        where: {
          userId_season: {
            userId,
            season
          }
        },
        create: {
          userId,
          season,
          pointsEarnedAsBuilder: pointsEarnedAsDeveloperNumber,
          pointsEarnedAsScout: pointsEarnedAsScoutNumber
        },
        update: {
          pointsEarnedAsBuilder: {
            increment: pointsEarnedAsDeveloperNumber
          },
          pointsEarnedAsScout: {
            increment: pointsEarnedAsScoutNumber
          }
        }
      });
    }

    // Calculate total points for all-time stats
    let totalPointsEarnedAsDeveloper = BigInt(0);
    let totalPointsEarnedAsScout = BigInt(0);

    for (const points of pointsBySeason.values()) {
      totalPointsEarnedAsDeveloper += points.pointsEarnedAsDeveloper;
      totalPointsEarnedAsScout += points.pointsEarnedAsScout;
    }

    const totalPointsEarnedAsDeveloperNumber = Number(formatUnits(totalPointsEarnedAsDeveloper, devTokenDecimals));
    const totalPointsEarnedAsScoutNumber = Number(formatUnits(totalPointsEarnedAsScout, devTokenDecimals));

    await prisma.userAllTimeStats.upsert({
      where: {
        userId
      },
      create: {
        pointsEarnedAsBuilder: totalPointsEarnedAsDeveloperNumber,
        pointsEarnedAsScout: totalPointsEarnedAsScoutNumber,
        user: {
          connect: {
            id: userId
          }
        }
      },
      update: {
        pointsEarnedAsBuilder: {
          increment: totalPointsEarnedAsDeveloperNumber
        },
        pointsEarnedAsScout: {
          increment: totalPointsEarnedAsScoutNumber
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
