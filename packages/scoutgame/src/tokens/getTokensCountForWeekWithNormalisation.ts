import { log } from '@charmverse/core/log';
import type { BuilderNftType, ScoutWallet } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';

import type { LeaderboardDeveloper } from '../builders/getDevelopersLeaderboard';
import { getDevelopersLeaderboard } from '../builders/getDevelopersLeaderboard';
import { weeklyRewardableBuilders } from '../protocol/constants';

import { calculateEarnableTokensForRank } from './calculateTokens';

export type PartialNftPurchaseEvent = {
  tokensPurchased: number;
  tokenId: number;
  nftType: BuilderNftType;
  from: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  to: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

const WEEKLY_TOKENS_ALLOCATION_PERCENTAGES = [5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10];

export async function getTokensCountForWeekWithNormalisation({ week }: { week: string }): Promise<{
  totalTokens: bigint;
  normalisationFactor: bigint;
  normalisationScale: bigint;
  normalisedDevelopers: { developer: LeaderboardDeveloper; normalisedTokens: bigint }[];
  weeklyAllocatedTokens: bigint;
  topWeeklyDevelopers: LeaderboardDeveloper[];
}> {
  const leaderboard = await getDevelopersLeaderboard({ week, quantity: weeklyRewardableBuilders });
  const weekNumber = getCurrentSeasonWeekNumber(week);
  const weeklyTokensAllocationPercentage = WEEKLY_TOKENS_ALLOCATION_PERCENTAGES[weekNumber - 1];
  if (!weeklyTokensAllocationPercentage) {
    throw new Error('Weekly tokens allocation percentage not found');
  }
  const season = getCurrentSeason(week);
  const weeklyAllocatedTokens = season.allocatedTokens * BigInt(weeklyTokensAllocationPercentage / 100);

  const tokensQuotas = leaderboard.map((developer) => ({
    developer,
    earnableTokens: calculateEarnableTokensForRank({ rank: developer.rank, weeklyAllocatedTokens })
  }));

  const totalEarnableTokens = tokensQuotas.reduce((acc, val) => acc + val.earnableTokens, BigInt(0));

  if (totalEarnableTokens === BigInt(0)) {
    log.warn('Tokens evaluated to 0', {
      week
    });
    throw new Error('Tokens evaluated to 0');
  }

  const normalisationScale = BigInt(100_000);
  const normalisationFactor = (weeklyAllocatedTokens / totalEarnableTokens) * normalisationScale;

  return {
    totalTokens: totalEarnableTokens,
    normalisationFactor,
    normalisationScale,
    normalisedDevelopers: tokensQuotas.map(({ developer, earnableTokens }) => ({
      developer,
      normalisedTokens: earnableTokens * BigInt(normalisationFactor)
    })),
    weeklyAllocatedTokens,
    topWeeklyDevelopers: leaderboard
  };
}
