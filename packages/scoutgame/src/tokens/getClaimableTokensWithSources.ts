import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import {
  getCurrentSeasonStart,
  getCurrentWeek,
  getLastWeek,
  getWeekStartEndFormatted,
  getDateFromISOWeek,
  getPreviousSeason,
  getAllISOWeeksFromSeasonStartUntilSeasonEnd
} from '@packages/dates/utils';
import { getFarcasterUserByIds } from '@packages/farcaster/getFarcasterUserById';
import { isTruthy } from '@packages/utils/types';
import { formatUnits, type Address } from 'viem';

import type { WeeklyClaimsTyped } from '../protocol/calculateWeeklyClaims';
import { getProtocolReadonlyClient } from '../protocol/clients/getProtocolReadonlyClient';
import { devTokenDecimals } from '../protocol/constants';

import { checkIsProcessingPayouts } from './checkIsProcessingPayouts';

export type ClaimInput = {
  week: ISOWeek;
  amount: bigint;
  proofs: string[];
  address: Address;
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
  claims: Record<Address, ClaimInput[]>;
};

export async function getClaimableTokensWithSources(userId: string): Promise<UnclaimedTokensSource> {
  const scoutWallets = await prisma.scoutWallet.findMany({
    where: {
      scoutId: userId
    },
    select: {
      address: true
    }
  });

  const walletAddresses = scoutWallets.map((wallet) => wallet.address.toLowerCase() as Address);

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

  const weeklyClaims = (await prisma.weeklyClaims.findMany({
    where: {
      season: getCurrentSeasonStart()
    }
  })) as WeeklyClaimsTyped[];

  const weeks = weeklyClaims.map((claim) => claim.week);

  const protocolClient = getProtocolReadonlyClient();
  const claimedWeeks = (
    await Promise.all(
      walletAddresses.flatMap((wallet) =>
        weeks.map((week) =>
          protocolClient.hasClaimed({ args: { account: wallet, week } }).then((hasClaimed) => ({
            wallet,
            week,
            hasClaimed
          }))
        )
      )
    )
  ).reduce(
    (acc, { wallet, week, hasClaimed }) => {
      acc[wallet] = hasClaimed ? [...(acc[wallet] || []), week] : acc[wallet] || [];
      return acc;
    },
    {} as Record<string, string[]>
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

  const isProcessing = await checkIsProcessingPayouts({ week: getLastWeek() });

  const claims: Record<Address, ClaimInput[]> = {};

  let totalTokens = 0;

  for (const walletAddress of walletAddresses) {
    const filteredWalletClaims = weeklyClaims.filter(
      (claim) => !claimedWeeks[walletAddress]?.includes(claim.week) && claim.proofsMap[walletAddress]?.length > 0
    );

    const claimInputs: ClaimInput[] = [];

    for (const claim of filteredWalletClaims) {
      const claimAmount = BigInt(claim.claims.leaves.find((leaf) => leaf.address === walletAddress)?.amount ?? '0');

      totalTokens += Number(formatUnits(claimAmount, devTokenDecimals));

      claimInputs.push({
        week: claim.week,
        address: walletAddress,
        amount: claimAmount,
        proofs: claim.proofsMap[walletAddress] ?? []
      });
    }

    if (claimInputs.length > 0) {
      claims[walletAddress] = claimInputs;
    }
  }

  return {
    developers: developersWithFarcaster,
    tokens: totalTokens,
    repos: uniqueRepos.slice(0, 3),
    claims,
    processingPayouts: isProcessing
  };
}
