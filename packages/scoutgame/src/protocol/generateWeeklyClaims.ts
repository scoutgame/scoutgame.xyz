import type { WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { getMerkleProofs } from '@charmverse/core/protocol';
import { getSeasonConfig, getNextSeason, getCurrentSeasonStart, getDateFromISOWeek } from '@packages/dates/utils';
import { DateTime } from 'luxon';
import { type Address } from 'viem';

import type { WeeklyClaimsCalculated } from './calculateWeeklyClaims';
import { getProtocolClaimsManagerWallet } from './clients/getProtocolClaimsManagerWallet';
import { getProtocolWriteClient } from './clients/getProtocolWriteClient';

type ClaimsBody = {
  leaves: ProvableClaim[];
};

export type WeeklyClaimsTyped = Omit<WeeklyClaims, 'claims' | 'proofsMap'> & {
  claims: ClaimsBody;
  proofsMap: Record<string, string[]>;
};

/**
 * Generate the claims for a given week
 * @param week - The week to generate claims for
 * @param weeklyClaimsCalculated - Output of calculateWeeklyClaims()
 * @returns The generated claims
 */
export async function generateWeeklyClaims({
  week,
  weeklyClaimsCalculated
}: {
  week: string;
  weeklyClaimsCalculated: WeeklyClaimsCalculated;
}): Promise<{ weeklyClaims: WeeklyClaimsTyped; totalDevelopers: number }> {
  const existingClaim = await prisma.weeklyClaims.findUnique({
    where: {
      week
    }
  });

  if (existingClaim) {
    throw new Error(`Claims for week ${week} already exist`);
  }

  const { claims, builderEvents, tokenReceipts, weeklyClaimId } = weeklyClaimsCalculated;

  const proofsMap: Record<Address, string[]> = {};

  for (const claim of claims) {
    const proof = getMerkleProofs(weeklyClaimsCalculated.merkleProofs.tree, {
      address: claim.address,
      amount: claim.amount.toString()
    });

    proofsMap[claim.address] = proof;
  }

  const rootHashWithNullByte = `0x${weeklyClaimsCalculated.merkleProofs.rootHash}`;

  const claimsBody: ClaimsBody = {
    leaves: claims
  };

  const validUntilDate = DateTime.now().toUTC().plus({ weeks: 13 });
  const validUntil = Math.floor(validUntilDate.toSeconds());

  await getProtocolWriteClient({ walletClient: getProtocolClaimsManagerWallet() }).setWeeklyMerkleRoot({
    args: {
      weeklyRoot: {
        isoWeek: week,
        validUntil,
        merkleRoot: rootHashWithNullByte,
        merkleTreeUri: `ipfs://scoutgame/merkle-tree/${week}`
      }
    }
  });

  const weeklyClaim = await prisma.$transaction(async (tx) => {
    const _weeklyClaim = await tx.weeklyClaims.create({
      data: {
        id: weeklyClaimId,
        week,
        merkleTreeRoot: rootHashWithNullByte,
        season: getCurrentSeasonStart(),
        totalClaimableDevToken: claims.reduce((acc, claim) => acc + BigInt(claim.amount), BigInt(0)).toString(),
        claims: claimsBody,
        proofsMap
      }
    });

    await tx.builderEvent.createMany({
      data: builderEvents
    });
    await tx.tokensReceipt.createMany({
      data: tokenReceipts
    });

    return _weeklyClaim;
  });

  return {
    weeklyClaims: weeklyClaim as WeeklyClaimsTyped,
    totalDevelopers: builderEvents.length
  };
}
