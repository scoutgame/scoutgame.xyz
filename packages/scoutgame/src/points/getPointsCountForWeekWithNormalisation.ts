import { log } from '@charmverse/core/log';
import type { BuilderNftType, ScoutWallet } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonWeekNumber } from '@packages/dates/utils';

import type { LeaderboardDeveloper } from '../builders/getDevelopersLeaderboard';
import { getDevelopersLeaderboard } from '../builders/getDevelopersLeaderboard';
import { weeklyRewardableBuilders } from '../protocol/constants';

import { calculateEarnableScoutPointsForRank } from './calculatePoints';

export type PartialNftPurchaseEvent = {
  tokensPurchased: number;
  tokenId: number;
  nftType: BuilderNftType;
  from: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  to: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

const WEEKLY_TOKENS_ALLOCATION_PERCENTAGES = [5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10];

export async function getPointsCountForWeekWithNormalisation({ week }: { week: string }): Promise<{
  totalTokens: number;
  normalisationFactor: number;
  normalisedDevelopers: { developer: LeaderboardDeveloper; normalisedTokens: number }[];
  weeklyAllocatedTokens: number;
  topWeeklyDevelopers: LeaderboardDeveloper[];
}> {
  const leaderboard = await getDevelopersLeaderboard({ week, quantity: weeklyRewardableBuilders });
  const weekNumber = getCurrentSeasonWeekNumber(week);
  const weeklyTokensAllocationPercentage = WEEKLY_TOKENS_ALLOCATION_PERCENTAGES[weekNumber - 1];
  const season = getCurrentSeason(week);
  const weeklyAllocatedTokens = season.allocatedTokens * (weeklyTokensAllocationPercentage / 100);

  const tokensQuotas = leaderboard.map((developer) => ({
    developer,
    earnableTokens: calculateEarnableScoutPointsForRank({ rank: developer.rank, weeklyAllocatedTokens })
  }));

  const totalEarnableTokens = tokensQuotas.reduce((acc, val) => acc + val.earnableTokens, 0);

  if (totalEarnableTokens === 0) {
    log.warn('Tokens evaluated to 0', {
      week
    });
    throw new Error('Tokens evaluated to 0');
  }

  const normalisationFactor = weeklyAllocatedTokens / totalEarnableTokens;

  return {
    totalTokens: totalEarnableTokens,
    normalisationFactor,
    normalisedDevelopers: tokensQuotas.map(({ developer, earnableTokens }) => ({
      developer,
      normalisedTokens: earnableTokens * normalisationFactor
    })),
    weeklyAllocatedTokens,
    topWeeklyDevelopers: leaderboard
  };
}
