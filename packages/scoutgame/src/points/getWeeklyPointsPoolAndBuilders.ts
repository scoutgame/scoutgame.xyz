import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export type PartialNftPurchaseEvent = {
  scoutId: string;
  tokensPurchased: number;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

/**
 * @param normalisedBuilders - Expected points share for the builder and their NFT holders for a specific week, with normalisation factor applied to ensure full weekly points pool is allocated
 */
export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const [
    topWeeklyBuilders,
    nftPurchaseEvents,
    { normalisationFactor, totalPoints, normalisedBuilders },
    weeklyAllocatedPoints
  ] = await Promise.all([
    getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week }),
    getNftPurchaseEvents({ week }),
    getPointsCountForWeekWithNormalisation({ week }),
    getCurrentWeekPointsAllocation({ week })
  ]);

  return {
    nftPurchaseEvents,
    topWeeklyBuilders,
    normalisationFactor,
    totalPoints,
    normalisedBuilders,
    weeklyAllocatedPoints
  };
}

async function getNftPurchaseEvents({ week }: { week: string }): Promise<PartialNftPurchaseEvent[]> {
  const season = getCurrentSeasonStart(week);
  return prisma.nFTPurchaseEvent.findMany({
    where: {
      builderEvent: {
        week: {
          lte: week
        }
      },
      builderNft: {
        season
      }
    },
    select: {
      scoutId: true,
      tokensPurchased: true,
      builderNft: {
        select: {
          builderId: true,
          nftType: true
        }
      }
    }
  });
}
