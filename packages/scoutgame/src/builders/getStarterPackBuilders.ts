import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getCurrentSeason } from '@packages/dates/utils';

import { starterPackBuilders } from '../builderNfts/builderRegistration/starterPack/starterPackBuilders';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type StarterPackBuilder = { builder: BuilderInfo; hasPurchased: boolean };

export async function getStarterPackBuilders({
  week = getCurrentWeek(),
  limit,
  userId
}: {
  week?: string;
  limit?: number;
  userId?: string;
} = {}): Promise<StarterPackBuilder[]> {
  const season = getCurrentSeason(week).start;
  const result = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      farcasterId: {
        in: starterPackBuilders.map((builder) => builder.fid)
      },
      builderNfts: {
        some: {
          season,
          nftType: BuilderNftType.starter_pack
        }
      },
      deletedAt: null
    },
    take: limit,
    select: {
      id: true,
      path: true,
      avatar: true,
      displayName: true,
      farcasterId: true,
      builderNfts: {
        where: {
          season,
          nftType: BuilderNftType.starter_pack
        },
        select: {
          // TODO: use the currentPriceInScoutToken when we move to $SCOUT
          currentPrice: true,
          nftSoldEvents: userId
            ? {
                where: {
                  scoutWallet: {
                    scoutId: userId
                  }
                },
                select: {
                  id: true
                }
              }
            : undefined,
          estimatedPayout: true,
          imageUrl: true,
          congratsImageUrl: true
        }
      },
      builderCardActivities: true,
      userSeasonStats: {
        where: {
          season
        },
        select: {
          level: true
        }
      },
      userWeeklyStats: {
        where: {
          season,
          week
        },
        select: {
          rank: true,
          gemsCollected: true
        }
      }
    }
  });

  return result.map((builder) => ({
    hasPurchased: !!builder.builderNfts[0]?.nftSoldEvents?.length,
    builder: {
      id: builder.id,
      path: builder.path,
      avatar: builder.avatar as string,
      displayName: builder.displayName,
      rank: builder.userWeeklyStats[0]?.rank || -1,
      // TODO: convert to $SCOUT
      price: builder.builderNfts[0]?.currentPrice,
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: builder.builderNfts[0]?.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
      builderStatus: 'approved',
      nftImageUrl: builder.builderNfts[0]?.imageUrl || '',
      nftType: BuilderNftType.starter_pack,
      farcasterId: builder.farcasterId,
      congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl || '',
      purchased: !!builder.builderNfts[0]?.nftSoldEvents?.length,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0
    }
  }));
}
