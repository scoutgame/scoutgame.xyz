import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { uniqueValues } from '@packages/utils/array';
import { isOnchainPlatform } from '@packages/utils/platform';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import { devTokenDecimals } from '../protocol/constants';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type CompositeCursor = {
  userId: string;
  rank?: number | null;
};

export async function getDevelopersForGallery({
  limit = 12, // multiple of 3, since we have 3 columns in the gallery
  week,
  cursor,
  scoutId,
  nftType: _nftType
}: {
  limit?: number;
  week: ISOWeek;
  cursor?: CompositeCursor | null;
  nftType: 'default' | 'starter';
  scoutId?: string;
}): Promise<{ developers: BuilderInfo[]; nextCursor: CompositeCursor | null }> {
  const nftType = _nftType === 'default' ? BuilderNftType.default : BuilderNftType.starter_pack;
  const season = getCurrentSeasonStart(week);

  const developers = await prisma.userWeeklyStats
    .findMany({
      where: {
        user: {
          builderStatus: 'approved',
          builderNfts: {
            some: {
              season,
              nftType
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
                nftType
              },
              select: {
                contractAddress: true,
                currentPrice: true,
                currentPriceDevToken: true,
                imageUrl: true,
                nftType: true,
                congratsImageUrl: true,
                estimatedPayout: true,
                estimatedPayoutDevToken: true,
                listings: {
                  where: {
                    completedAt: null
                  },
                  select: {
                    createdAt: true,
                    id: true,
                    seller: {
                      select: {
                        scoutId: true
                      }
                    },
                    price: true,
                    priceDevToken: true,
                    order: true
                  }
                },
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
        price: isOnchainPlatform()
          ? BigInt(stat.user.builderNfts?.[0]?.currentPriceDevToken ?? 0)
          : (stat.user.builderNfts?.[0]?.currentPrice ?? BigInt(0)),
        scoutedBy: uniqueValues(
          stat.user.builderNfts?.[0]?.nftSoldEvents?.flatMap((event) => event.scoutWallet?.scoutId) ?? []
        ).length,
        nftsSold: stat.user.userSeasonStats[0]?.nftsSold ?? 0,
        builderStatus: stat.user.builderStatus!,
        level: stat.user.userSeasonStats[0]?.level ?? 0,
        last14DaysRank: normalizeLast14DaysRank(stat.user.builderCardActivities[0]),
        estimatedPayout: isOnchainPlatform()
          ? Number(BigInt(stat.user.builderNfts?.[0]?.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
          : (stat.user.builderNfts?.[0]?.estimatedPayout ?? 0),
        gemsCollected: stat.user.userWeeklyStats[0]?.gemsCollected ?? 0,
        listings:
          stat.user.builderNfts?.[0]?.listings.map(({ seller, ...listing }) => ({
            ...listing,
            scoutId: seller.scoutId,
            order: listing.order as OrderWithCounter,
            price: isOnchainPlatform() ? BigInt(listing.priceDevToken ?? 0) : (listing.price ?? BigInt(0)),
            contractAddress: stat.user.builderNfts?.[0]?.contractAddress as `0x${string}`
          })) ?? [],
        nftsSoldToScout:
          stat.user.builderNfts?.[0]?.nftSoldEvents
            ?.filter((event) => event.scoutWallet?.scoutId === scoutId)
            .reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || undefined
      }))
    );
  const userId = developers[developers.length - 1]?.id;
  const rank = developers[developers.length - 1]?.rank;
  return { developers, nextCursor: developers.length === limit ? { userId, rank } : null };
}
