import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getCurrentWeek, getLastWeek } from '@packages/dates/utils';
import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { isTruthy } from '@packages/utils/types';
import type { Address } from 'viem';

import { getTokensClaimedEvents } from '../builderNfts/accounting/getTokensClaimedEvents';
import type { WeeklyClaimsTyped } from '../protocol/calculateWeeklyClaims';
import { devTokenDecimals } from '../protocol/constants';

import { checkIsProcessingPayouts } from './checkIsProcessingPayouts';

export type ClaimInput = {
  week: ISOWeek;
  amount: bigint;
  proofs: string[];
};

export type ClaimData = {
  address: Address;
  weeklyProofs: ClaimInput[];
};

export type UnclaimedTokensSource = {
  developers: {
    id: string;
    avatar: string | null;
    farcasterHandle?: string;
    displayName: string;
  }[];
  tokens: number;
  repos: string[];
  processingPayouts: boolean;
  claimData: ClaimData;
};

export async function getClaimableTokensWithSources(userId: string): Promise<UnclaimedTokensSource> {
  const scoutWallets = await prisma.scoutWallet.findMany({
    where: {
      scoutId: userId,
      primary: true
    },
    select: {
      address: true
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
      },
      claimedAt: null
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

  const developerIdTokensRecord: Record<string, number> = {};
  for (const receipt of tokenReceipts) {
    if (receipt.event.type === 'gems_payout' && receipt.event.builderId !== userId) {
      if (!developerIdTokensRecord[receipt.event.builderId]) {
        developerIdTokensRecord[receipt.event.builderId] = Number(
          BigInt(receipt.value) / BigInt(10 ** devTokenDecimals)
        );
      } else {
        developerIdTokensRecord[receipt.event.builderId] += Number(
          BigInt(receipt.value) / BigInt(10 ** devTokenDecimals)
        );
      }
    }
  }

  const topDeveloperIds = Object.entries(developerIdTokensRecord)
    .sort((developer1, developer2) => developer2[1] - developer1[1])
    .map(([developerId]) => developerId)
    .slice(0, 3);

  const developers = await prisma.scout.findMany({
    where: {
      id: { in: topDeveloperIds },
      deletedAt: null
    },
    select: {
      id: true,
      avatar: true,
      displayName: true,
      farcasterId: true
    }
  });

  const farcasterIds = developers.map((d) => d.farcasterId).filter(isTruthy);
  const farcasterUsers = await getFarcasterUserByIds(farcasterIds).catch((err) => {
    log.error('Could not retrieve farcaster profiles', { farcasterIds, error: err });
    return [];
  });
  const developersWithFarcaster: UnclaimedTokensSource['developers'] = developers.map((developer) => {
    const farcasterUser = farcasterUsers.find((f) => f.fid === developer.farcasterId);
    return {
      ...developer,
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
      season: getCurrentSeasonStart()
    }
  })) as WeeklyClaimsTyped[];

  const claimProofs: ClaimInput[] = weeklyClaims
    .map((claim) => ({
      week: claim.week,
      amount:
        BigInt(
          claim.claims.leaves.find((leaf) => leaf.address.toLowerCase() === scoutWallets[0].address.toLowerCase())
            ?.amount ?? '0'
        ) ?? 0,
      proofs: claim.proofsMap[scoutWallets[0].address.toLowerCase()] ?? []
    }))
    .filter((proof) => proof.amount > 0 && proof.proofs.length > 0 && !claimedWeeks.includes(proof.week));

  const isProcessing = await checkIsProcessingPayouts({ week: getLastWeek() });

  return {
    developers: developersWithFarcaster,
    tokens: claimProofs.reduce((acc, proof) => acc + Number(proof.amount), 0),
    repos: uniqueRepos.slice(0, 3),
    claimData: {
      address: scoutWallets[0].address as Address,
      weeklyProofs: claimProofs
    },
    processingPayouts: isProcessing
  };
}
