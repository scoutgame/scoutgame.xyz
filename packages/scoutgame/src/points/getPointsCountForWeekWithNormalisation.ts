import { log } from '@charmverse/core/log';
import type { BuilderNftType, ScoutWallet } from '@charmverse/core/prisma-client';

import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import type { LeaderboardBuilder } from '../builders/getBuildersLeaderboard';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';
import { getBuildersLeaderboardFromEAS } from '../builders/getBuildersLeaderboardFromEAS';
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

export async function getPointsCountForWeekWithNormalisation({
  week,
  useOnchainLeaderboard
}: {
  week: string;
  useOnchainLeaderboard?: boolean;
}): Promise<{
  totalPoints: number;
  normalisationFactor: number;
  normalisedBuilders: { builder: LeaderboardBuilder; normalisedPoints: number }[];
  weeklyAllocatedPoints: number;
  topWeeklyBuilders: LeaderboardBuilder[];
}> {
  const leaderboard = useOnchainLeaderboard
    ? await getBuildersLeaderboardFromEAS({ week, quantity: weeklyRewardableBuilders })
    : await getBuildersLeaderboard({ week, quantity: weeklyRewardableBuilders });

  const weeklyAllocatedPoints = await getCurrentWeekPointsAllocation({ week });

  const pointsQuotas = leaderboard.map((builder, index) => ({
    builder,
    earnablePoints: calculateEarnableScoutPointsForRank({ rank: builder.rank, weeklyAllocatedPoints })
  }));

  const points = pointsQuotas.reduce((acc, val) => acc + val.earnablePoints, 0);

  if (points === 0) {
    log.warn('Points evaluated to 0', {
      week
    });
    throw new Error('Points evaluated to 0');
  }

  const normalisationFactor = weeklyAllocatedPoints / points;

  return {
    totalPoints: points,
    normalisationFactor,
    normalisedBuilders: pointsQuotas.map(({ builder, earnablePoints }) => ({
      builder,
      normalisedPoints: earnablePoints * normalisationFactor
    })),
    weeklyAllocatedPoints,
    topWeeklyBuilders: leaderboard
  };
}
