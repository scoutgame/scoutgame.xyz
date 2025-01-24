import type { BuilderNftType, ScoutWallet } from '@charmverse/core/prisma';

import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export type PartialNftPurchaseEvent = {
  tokensPurchased: number;
  tokenId: number;
  nftType: BuilderNftType;
  from: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  to: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

/**
 * @param normalisedBuilders - Expected points share for the builder and their NFT holders for a specific week, with normalisation factor applied to ensure full weekly points pool is allocated
 */
export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const [topWeeklyBuilders, { normalisationFactor, totalPoints, normalisedBuilders }, weeklyAllocatedPoints] =
    await Promise.all([
      getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week }),
      getPointsCountForWeekWithNormalisation({ week }),
      getCurrentWeekPointsAllocation({ week })
    ]);

  return {
    topWeeklyBuilders,
    normalisationFactor,
    totalPoints,
    normalisedBuilders,
    weeklyAllocatedPoints
  };
}
