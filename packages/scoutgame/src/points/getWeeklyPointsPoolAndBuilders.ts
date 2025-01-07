import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';
import { getCurrentSeasonStart } from '../dates/utils';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export type PartialNftPurchaseEvent = {
  scoutId: string;
  tokensPurchased: number;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const [topWeeklyBuilders, nftPurchaseEvents, { normalisationFactor, totalPoints }, weeklyAllocatedPoints] =
    await Promise.all([
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
