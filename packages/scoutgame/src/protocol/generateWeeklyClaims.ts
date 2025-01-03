import { log } from '@charmverse/core/log';
import type { WeeklyClaims } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProvableClaim } from '@charmverse/core/protocol';
import { getMerkleProofs } from '@charmverse/core/protocol';
import { type Address } from 'viem';

import { weeksPerSeason } from '../dates/config';
import { getCurrentSeasonStart, getDateFromISOWeek } from '../dates/utils';

import type { WeeklyClaimsCalculated } from './calculateWeeklyClaims';
import { protocolImplementationWriteClient } from './clients/protocolWriteClients';
import { getSablierLockupContract, sablierStreamId } from './constants';

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
}): Promise<{ weeklyClaims: WeeklyClaimsTyped; totalBuilders: number; totalPoints: number }> {
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
      amount: claim.amount
    });

    proofsMap[claim.address] = proof;
  }

  const rootHashWithNullByte = `0x${weeklyClaimsCalculated.merkleProofs.rootHash}`;

  const claimsBody: ClaimsBody = {
    leaves: claims
  };

  await protocolImplementationWriteClient().setWeeklyMerkleRoot({
    args: {
      weeklyRoot: {
        isoWeek: week,
        // Tokens can be claimed until the end of the season and the next season
        validUntil: getDateFromISOWeek(getCurrentSeasonStart()).plus({ weeks: 2 * weeksPerSeason }),
        merkleRoot: rootHashWithNullByte,
        // Stub definition until we add in IPFS
        merkleTreeUri: `ipfs://scoutgame/merkle-tree/${week}`
      }
    }
  });

  // Fund the protocol contract
  await getSablierLockupContract()
    .claim({
      args: {
        streamId: BigInt(sablierStreamId)
      }
    })
    .catch((error: any) => {
      log.error(`Error claiming stream ${sablierStreamId}`, error);
    });

  const weeklyClaim = await prisma.$transaction(async (tx) => {
    const _weeklyClaim = await tx.weeklyClaims.create({
      data: {
        id: weeklyClaimId,
        week,
        merkleTreeRoot: rootHashWithNullByte,
        season: getCurrentSeasonStart(),
        totalClaimable: claims.reduce((acc, claim) => acc + claim.amount, 0),
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
    totalBuilders: builderEvents.length,
    totalPoints: tokenReceipts.length
  };
}
