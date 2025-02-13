import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek } from '@packages/dates/utils';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { uniqueValues } from '@packages/utils/array';

import { normalizeLast14DaysRank } from '../builders/utils/normalizeLast14DaysRank';

export async function getBuildersByFid({
  fids,
  limit,
  season,
  nftType = 'default'
}: {
  fids: number[];
  limit: number;
  season: string;
  nftType?: BuilderNftType;
}): Promise<{ builders: BuilderInfo[] }> {
  const builders = await prisma.scout
    .findMany({
      where: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season,
            nftType
          }
        },
        farcasterId: {
          in: uniqueValues(fids)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        path: true,
        displayName: true,
        builderStatus: true,
        createdAt: true,
        farcasterId: true,
        builderNfts: {
          where: {
            season,
            nftType
          },
          select: {
            contractAddress: true,
            imageUrl: true,
            congratsImageUrl: true,
            // TODO: use the currentPriceInScoutToken when we move to $SCOUT
            currentPrice: true,
            nftSoldEvents: {
              distinct: 'walletAddress'
            },
            nftType: true,
            estimatedPayout: true
          }
        },
        builderCardActivities: {
          select: {
            last14Days: true
          }
        },
        userWeeklyStats: {
          where: {
            week: getCurrentWeek(),
            season
          },
          select: {
            rank: true
          }
        },
        userSeasonStats: {
          where: {
            season
          },
          select: {
            level: true
          }
        }
      }
    })
    .then((scouts) => {
      return scouts.map((scout) => ({
        id: scout.id,
        nftImageUrl: scout.builderNfts[0]?.imageUrl,
        congratsImageUrl: scout.builderNfts[0]?.congratsImageUrl,
        path: scout.path,
        displayName: scout.displayName,
        price: scout.builderNfts?.[0]?.currentPrice ?? 0,
        scoutedBy: scout.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
        rank: scout.userWeeklyStats[0]?.rank ?? -1,
        builderStatus: scout.builderStatus!,
        farcasterId: scout.farcasterId,
        level: scout.userSeasonStats[0]?.level ?? 0,
        estimatedPayout: scout.builderNfts[0]?.estimatedPayout ?? 0,
        last14DaysRank: normalizeLast14DaysRank(scout.builderCardActivities[0]),
        contractAddress: scout.builderNfts[0]?.contractAddress || '',
        nftType: scout.builderNfts[0]?.nftType || 'default'
      }));
    });

  return {
    builders
  };
}
