import type { BuilderNft } from '@charmverse/core/prisma-client';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getCurrentSeason } from '@packages/dates/utils';
import type { NftPurchaseEvent } from '@packages/mixpanel/interfaces';

import type { BuilderInfo } from './interfaces';
import { normalizeLast7DaysGems } from './utils/normalizeLast7DaysGems';

export type StarterPackBuilder = BuilderInfo & { purchased: boolean };

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
  const starterPackBuilders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
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
        include: userId
          ? {
              nftSoldEvents: {
                where: {
                  scoutId: userId
                },
                select: {
                  id: true
                }
              }
            }
          : undefined
      },
      builderCardActivities: true,
      userSeasonStats: {
        where: {
          season
        },
        select: {
          pointsEarnedAsBuilder: true,
          nftsSold: true
        }
      },
      userWeeklyStats: {
        where: {
          season,
          week
        },
        select: {
          rank: true
        }
      }
    }
  });

  return starterPackBuilders.map((builder) => ({
    id: builder.id,
    path: builder.path,
    avatar: builder.avatar as string,
    displayName: builder.displayName,
    rank: builder.userWeeklyStats[0]?.rank || -1,
    price: builder.builderNfts[0]?.currentPrice,
    points: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    cards: builder.userSeasonStats[0]?.nftsSold || 0,
    builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    last7DaysGems: normalizeLast7DaysGems(builder.builderCardActivities[0]),
    nftsSold: builder.userSeasonStats[0]?.nftsSold || 0,
    builderStatus: 'approved',
    nftImageUrl: builder.builderNfts[0]?.imageUrl || '',
    nftType: BuilderNftType.starter_pack,
    farcasterId: builder.farcasterId,
    congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl || '',
    purchased: !!(builder.builderNfts[0] as BuilderNft & { nftSoldEvents?: NftPurchaseEvent[] })?.nftSoldEvents?.length
  }));
}
