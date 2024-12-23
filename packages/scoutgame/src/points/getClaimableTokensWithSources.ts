import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { isTruthy } from '@packages/utils/types';
import type { Address } from 'viem';

import { getTokensClaimedEvents } from '../builderNfts/accounting/getTokensClaimedEvents';
import type { ISOWeek } from '../dates';
import { currentSeason, getCurrentWeek } from '../dates';
import type { WeeklyClaimsTyped } from '../protocol/generateWeeklyClaims';

import type { UnclaimedPointsSource } from './getClaimablePointsWithSources';

export type ClaimInput = {
  week: ISOWeek;
  amount: number;
  proofs: string[];
};

export type ClaimData = {
  address: Address;
  weeklyProofs: ClaimInput[];
};

export type UnclaimedTokensSource = UnclaimedPointsSource & {
  claimData: ClaimData;
};

export async function getClaimableTokensWithSources(userId: string): Promise<UnclaimedTokensSource> {
  const scoutWallets = await prisma.scoutWallet.findMany({
    where: {
      scoutId: userId
    }
  });

  if (!scoutWallets.length) {
    log.error('Scout wallet not found', { userId });
    throw new Error('Scout wallet not found');
  }

  const tokenReceipts = await prisma.tokensReceipt.findMany({
    where: {
      recipientWalletAddress: {
        in: scoutWallets.map((wallet) => wallet.address)
      }
    },
    select: {
      value: true,
      recipientWalletAddress: true,
      event: {
        select: {
          week: true,
          type: true,
          builderId: true,
          githubEvent: {
            select: {
              repo: {
                select: {
                  name: true,
                  owner: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const claimedWeeks = (await getTokensClaimedEvents({ address: scoutWallets[0].address as Address })).map(
    (ev) => ev.args.week
  );

  const builderIdScoutPointsRecord: Record<string, number> = {};
  for (const receipt of tokenReceipts) {
    if (receipt.event.type === 'gems_payout' && receipt.event.builderId !== userId) {
      if (!builderIdScoutPointsRecord[receipt.event.builderId]) {
        builderIdScoutPointsRecord[receipt.event.builderId] = receipt.value;
      } else {
        builderIdScoutPointsRecord[receipt.event.builderId] += receipt.value;
      }
    }
  }

  const topBuilderIds = Object.entries(builderIdScoutPointsRecord)
    .sort((builder1, builder2) => builder2[1] - builder1[1])
    .map(([builderId]) => builderId)
    .slice(0, 3);

  const builders = await prisma.scout.findMany({
    where: {
      id: { in: topBuilderIds }
    },
    select: {
      id: true,
      avatar: true,
      displayName: true,
      farcasterId: true
    }
  });

  const farcasterIds = builders.map((b) => b.farcasterId).filter(isTruthy);
  const farcasterUsers = await getFarcasterUserByIds(farcasterIds).catch((err) => {
    log.error('Could not retrieve farcaster profiles', { farcasterIds, error: err });
    return [];
  });
  const buildersWithFarcaster: UnclaimedPointsSource['builders'] = builders.map((builder) => {
    const farcasterUser = farcasterUsers.find((f) => f.fid === builder.farcasterId);
    return {
      ...builder,
      farcasterHandle: farcasterUser?.username
    };
  });

  const repos = await prisma.githubEvent.findMany({
    where: {
      builderEvent: {
        week: getCurrentWeek(),
        builderId: userId
      }
    },
    select: {
      repo: {
        select: {
          name: true,
          owner: true
        }
      }
    }
  });

  const uniqueRepos = Array.from(new Set(repos.map((repo) => `${repo.repo.owner}/${repo.repo.name}`)));

  const weeklyClaims = (await prisma.weeklyClaims.findMany({
    where: {
      season: currentSeason
    }
  })) as WeeklyClaimsTyped[];

  const claimProofs = weeklyClaims
    .map((claim) => ({
      week: claim.week,
      amount:
        claim.claims.leaves.find((leaf) => leaf.address.toLowerCase() === scoutWallets[0].address.toLowerCase())
          ?.amount ?? 0,
      proofs: claim.proofsMap[scoutWallets[0].address.toLowerCase()] ?? []
    }))
    .filter((proof) => proof.amount > 0 && proof.proofs.length > 0 && !claimedWeeks.includes(proof.week));

  return {
    builders: buildersWithFarcaster,
    points: claimProofs.reduce((acc, proof) => acc + proof.amount, 0),
    bonusPartners: [],
    repos: uniqueRepos.slice(0, 3),
    claimData: {
      address: scoutWallets[0].address as Address,
      weeklyProofs: claimProofs
    }
  };
}
