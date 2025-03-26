import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getCurrentSeason } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';

import { devTokenDecimals } from '../protocol/constants';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type StarterCardDeveloper = { builder: BuilderInfo; hasPurchased?: boolean };

export async function getStarterCardDevelopers({
  week = getCurrentWeek(),
  limit = 10,
  userId
}: {
  week?: string;
  limit?: number;
  userId?: string;
} = {}): Promise<StarterCardDeveloper[]> {
  const season = getCurrentSeason(week).start;
  const result = await prisma.builderNft.findMany({
    where: {
      builder: {
        builderStatus: 'approved',
        deletedAt: null
      },
      season,
      nftType: BuilderNftType.starter_pack
    },
    orderBy: [{ estimatedPayout: 'desc' }],
    take: limit,
    select: {
      builder: {
        select: {
          id: true,
          path: true,
          avatar: true,
          displayName: true,
          farcasterId: true,
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
      },
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
  });

  return result.map(({ builder, ...nft }) => ({
    hasPurchased: !!nft.nftSoldEvents?.length,
    builder: {
      id: builder.id,
      path: builder.path,
      avatar: builder.avatar as string,
      displayName: builder.displayName,
      rank: builder.userWeeklyStats[0]?.rank || -1,
      price: isOnchainPlatform() ? BigInt(nft.currentPriceDevToken ?? 0) : (nft.currentPrice ?? BigInt(0)),
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: isOnchainPlatform()
        ? Number(BigInt(nft.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
        : nft.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
      builderStatus: 'approved',
      nftImageUrl: nft.imageUrl || '',
      nftType: BuilderNftType.starter_pack,
      farcasterId: builder.farcasterId,
      congratsImageUrl: nft.congratsImageUrl || '',
      purchased: !!nft.nftSoldEvents?.length,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0
    }
  }));
}
