import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentWeek, getPreviousWeek } from '@packages/dates/utils';
import { BasicUserInfoSelect } from '@packages/users/queries';

import type { BuilderInfo } from './interfaces';
import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

const userSelect = (week: string, season: string) => ({
  ...BasicUserInfoSelect,
  userSeasonStats: {
    where: {
      season
    },
    select: {
      pointsEarnedAsBuilder: true,
      nftsSold: true,
      level: true
    }
  },
  builderCardActivities: {
    select: {
      last7Days: true
    }
  },
  userWeeklyStats: {
    where: {
      week
    },
    select: {
      gemsCollected: true,
      rank: true
    }
  },
  builderNfts: {
    where: {
      season,
      nftType: BuilderNftType.default
    },
    select: {
      currentPrice: true,
      imageUrl: true,
      congratsImageUrl: true,
      estimatedPayout: true
    }
  }
});

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

  return builders.map((builder) => {
    return {
      id: builder.id,
      path: builder.path,
      displayName: builder.displayName,
      builderPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
      price: builder.builderNfts[0]?.currentPrice ?? 0,
      nftImageUrl: builder.builderNfts[0]?.imageUrl,
      congratsImageUrl: builder.builderNfts[0]?.congratsImageUrl,
      nftsSold: builder.userSeasonStats[0]?.nftsSold || 0,
      builderStatus: builder.builderStatus!,
      rank: builder.userWeeklyStats[0]?.rank || -1,
      level: builder.userSeasonStats[0]?.level || 0,
      estimatedPayout: builder.builderNfts[0]?.estimatedPayout || 0,
      last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
      nftType: BuilderNftType.default
    };
  });
}
