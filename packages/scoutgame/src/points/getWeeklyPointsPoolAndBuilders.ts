import type { BuilderNftType } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';
import { getCurrentSeason } from '../dates/utils';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export type PartialNftPurchaseEvent = {
  scoutId: string;
  tokensPurchased: number;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const season = getCurrentSeason(week).start;
  const [topWeeklyBuilders, nftPurchaseEvents, { normalisationFactor, totalPoints }, weeklyAllocatedPoints] =
    await Promise.all([
      getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week }),
      getNftPurchaseEvents({ week, season }),
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

async function getNftPurchaseEvents({
  week,
  season
}: {
  week: string;
  season: string;
}): Promise<PartialNftPurchaseEvent[]> {
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
