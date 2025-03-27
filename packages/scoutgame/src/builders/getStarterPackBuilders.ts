import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getCurrentSeason } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';

import { starterPackBuilders } from '../builderNfts/builderRegistration/starterPack/starterPackBuilders';
import { devTokenDecimals } from '../protocol/constants';

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
          currentPriceDevToken: true,
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
          estimatedPayoutDevToken: true,
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
      price: isOnchainPlatform()
        ? BigInt(builder.builderNfts[0]?.currentPriceDevToken ?? 0)
        : (builder.builderNfts[0]?.currentPrice ?? BigInt(0)),
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: isOnchainPlatform()
        ? Number(BigInt(builder.builderNfts[0]?.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
        : builder.builderNfts[0]?.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
      builderStatus: 'approved',
      nftImageUrl: builder.builderNfts[0]?.imageUrl || '',
      nftType: BuilderNftType.starter_pack,
      farcasterId: builder.farcasterId,
      congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl || '',
      purchased: !!builder.builderNfts[0]?.nftSoldEvents?.length,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
      listings: []
    }
  }));
}
