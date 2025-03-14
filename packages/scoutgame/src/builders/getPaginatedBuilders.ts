import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { uniqueValues } from '@packages/utils/array';
import { getPlatform } from '@packages/utils/platform';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type CompositeCursor = {
  userId: string;
  rank?: number | null;
};

const platform = getPlatform();

export async function getPaginatedBuilders({
  limit,
  week,
  cursor,
  scoutId
}: {
  limit: number;
  week: ISOWeek;
  cursor: CompositeCursor | null;
  scoutId?: string;
}): Promise<{ builders: BuilderInfo[]; nextCursor: CompositeCursor | null }> {
  const season = getCurrentSeasonStart(week);

  const builders = await prisma.userWeeklyStats
    .findMany({
      where: {
        user: {
          builderStatus: 'approved',
          builderNfts: {
            some: {
              season,
              nftType: BuilderNftType.default
            }
          }
        },
        week
      },
      orderBy: [
        {
          rank: 'asc'
        },
        {
          userId: 'asc'
        }
      ],
      skip: cursor ? 1 : 0,
      take: limit,
      cursor: cursor
        ? {
            rank: cursor.rank === -1 ? null : cursor.rank,
            userId_week: {
              userId: cursor.userId,
              week
            }
          }
        : undefined,
      select: {
        rank: true,
        user: {
          select: {
            id: true,
            path: true,
            displayName: true,
            builderStatus: true,
            builderNfts: {
              where: {
                season,
                nftType: BuilderNftType.default
              },
              select: {
                contractAddress: true,
                currentPrice: true,
                currentPriceInScoutToken: true,
                imageUrl: true,
                nftType: true,
                congratsImageUrl: true,
                estimatedPayout: true,
                nftSoldEvents: {
                  where: {
                    ...validMintNftPurchaseEvent,
                    builderEvent: {
                      season
                    }
                  },
                  select: {
                    scoutWallet: {
                      select: {
                        scoutId: true
                      }
                    },
                    tokensPurchased: true
                  }
                }
              }
            },
            builderCardActivities: {
              select: {
                last14Days: true
              }
            },
            userAllTimeStats: {
              select: {
                pointsEarnedAsBuilder: true
              }
            },
            userWeeklyStats: {
              where: {
                week
              },
              select: {
                gemsCollected: true
              }
            },
            userSeasonStats: {
              where: {
                season
              },
              select: {
                level: true,
                nftsSold: true
              }
            }
          }
        }
      }
    })
    .then((stats) =>
      stats.map((stat) => ({
        id: stat.user.id,
        rank: stat.rank ?? -1,
        nftImageUrl: stat.user.builderNfts[0]?.imageUrl,
        contractAddress: stat.user.builderNfts[0]?.contractAddress,
        nftType: stat.user.builderNfts[0]?.nftType,
        congratsImageUrl: stat.user.builderNfts[0]?.congratsImageUrl,
        path: stat.user.path,
        displayName: stat.user.displayName,
        builderPoints: stat.user.userAllTimeStats[0]?.pointsEarnedAsBuilder ?? 0,
        price:
          platform === 'onchain_webapp'
            ? BigInt(stat.user.builderNfts?.[0]?.currentPriceInScoutToken ?? 0)
            : (stat.user.builderNfts?.[0]?.currentPrice ?? BigInt(0)),
        scoutedBy: uniqueValues(
          stat.user.builderNfts?.[0]?.nftSoldEvents?.flatMap((event) => event.scoutWallet?.scoutId) ?? []
        ).length,
        nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
        builderStatus: stat.user.builderStatus!,
        level: stat.user.userSeasonStats[0]?.level ?? 0,
        last14DaysRank: normalizeLast14DaysRank(stat.user.builderCardActivities[0]),
        estimatedPayout: stat.user.builderNfts?.[0]?.estimatedPayout ?? 0,
        gemsCollected: stat.user.userWeeklyStats[0]?.gemsCollected ?? 0,
        nftsSoldToScout:
          stat.user.builderNfts?.[0]?.nftSoldEvents
            ?.filter((event) => event.scoutWallet?.scoutId === scoutId)
            .reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || undefined
      }))
    );
  const userId = builders[builders.length - 1]?.id;
  const rank = builders[builders.length - 1]?.rank;
  return { builders, nextCursor: builders.length === limit ? { userId, rank } : null };
}
