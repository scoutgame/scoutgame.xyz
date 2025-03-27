import type { Prisma } from '@charmverse/core/prisma-client';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { OrderWithCounter } from '@opensea/seaport-js/lib/types';
import { getCurrentSeason, getCurrentWeek, getPreviousWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';
import { isOnchainPlatform } from '@packages/utils/platform';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import { devTokenDecimals } from '../protocol/constants';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

const userSelect = (week: string, season: string, userId?: string) =>
  ({
    ...BasicUserInfoSelect,
    userSeasonStats: {
      where: {
        season
      },
      select: {
        level: true
      }
    },
    builderCardActivities: {
      select: {
        last14Days: true
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
    builderNfts: {
      where: {
        season,
        nftType: BuilderNftType.default
      },
      select: {
        currentPriceDevToken: true,
        currentPrice: true,
        imageUrl: true,
        congratsImageUrl: true,
        estimatedPayout: true,
        estimatedPayoutDevToken: true,
        contractAddress: true,
        listings: {
          select: {
            id: true,
            price: true,
            priceDevToken: true,
            order: true,
            seller: {
              select: {
                scoutId: true
              }
            }
          }
        },
        nftSoldEvents: userId
          ? {
              where: {
                builderEvent: {
                  season
                },
                ...validMintNftPurchaseEvent,
                scoutWallet: {
                  scoutId: userId
                }
              },
              select: {
                tokensPurchased: true
              }
            }
          : undefined
      }
    }
  }) satisfies Prisma.ScoutSelect;

export async function getTodaysHotBuilders({ week = getCurrentWeek() }: { week?: string } = {}): Promise<
  BuilderInfo[]
> {
  const season = getCurrentSeason(week).start;
  const currentWeekBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      user: {
        builderStatus: 'approved',
        builderNfts: {
          some: {
            season,
            nftType: BuilderNftType.default
          }
        },
        userWeeklyStats: {
          some: {
            week,
            gemsCollected: {
              gt: 0
            }
          }
        }
      },
      week
    },
    take: 3,
    orderBy: {
      rank: 'asc'
    },
    select: {
      user: {
        select: userSelect(week, season)
      }
    }
  });

  const totalCurrentWeekBuilders = currentWeekBuilders.length;

  const previousWeekBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      user: {
        id: {
          notIn: currentWeekBuilders.map((builder) => builder.user.id)
        },
        builderStatus: 'approved'
      },
      week: getPreviousWeek(week)
    },
    orderBy: {
      rank: 'asc'
    },
    take: 10 - totalCurrentWeekBuilders,
    select: {
      user: {
        select: userSelect(week, season)
      }
    }
  });

  const builders = [
    ...currentWeekBuilders.map((builder) => builder.user),
    ...previousWeekBuilders.map((builder) => builder.user)
  ];

  const isOnchain = isOnchainPlatform();

  return builders.map((builder) => {
    return {
      id: builder.id,
      path: builder.path,
      displayName: builder.displayName,
      price: isOnchainPlatform()
        ? BigInt(builder.builderNfts[0]?.currentPriceDevToken ?? 0)
        : (builder.builderNfts[0]?.currentPrice ?? BigInt(0)),
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl,
      builderStatus: builder.builderStatus!,
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: isOnchain
        ? Number(BigInt(builder.builderNfts[0]?.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
        : builder.builderNfts[0]?.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
      nftType: BuilderNftType.default,
      gemsCollected: builder.userWeeklyStats[0]?.gemsCollected || 0,
      nftsSoldToScout:
        builder.builderNfts[0]?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0) || 0,
      listings: builder.builderNfts[0]?.listings.map(({ seller, ...listing }) => ({
        ...listing,
        scoutId: seller.scoutId,
        price: isOnchain ? BigInt(listing.priceDevToken ?? 0) : (listing.price ?? BigInt(0)),
        contractAddress: builder.builderNfts[0]?.contractAddress as `0x${string}`,
        order: listing.order as OrderWithCounter
      }))
    };
  });
}
