import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';

export type DraftDeveloper = {
  id: string;
  displayName: string;
  avatar: string;
  path: string;
  level: number;
  seasonPoints: number;
  weeklyRanks: (number | null)[];
  rank: number;
};

export type DraftDeveloperSort = 'all' | 'trending';

export async function getDraftDevelopers({
  search,
  sort
}: {
  search?: string;
  sort?: DraftDeveloperSort;
}): Promise<DraftDeveloper[]> {
  const season = process.env.CURRENT_SEASON || getPreviousSeason(getCurrentSeasonStart());

  if (!season) {
    throw new Error('No draft season found');
  }

  const builders = await prisma.scout.findMany({
    where: {
      AND: search
        ? [
            {
              path: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              displayName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        : undefined,
      builderNfts: {
        some: {
          nftType: 'default',
          season
        }
      },
      deletedAt: null,
      wallets: {
        some: {
          primary: true
        }
      }
    },
    select: {
      id: true,
      displayName: true,
      avatar: true,
      path: true,
      userWeeklyStats: {
        where: {
          season
        },
        select: {
          rank: true
        },
        orderBy: {
          week: 'asc'
        }
      },
      userSeasonStats: {
        where: {
          season
        },
        select: {
          level: true,
          pointsEarnedAsBuilder: true
        }
      },
      draftSeasonOffersReceived: {
        select: {
          id: true
        }
      }
    }
  });

  return builders
    .map((builder) => ({
      id: builder.id,
      displayName: builder.displayName,
      avatar: builder.avatar ?? '',
      path: builder.path,
      level: builder.userSeasonStats[0]?.level ?? 0,
      seasonPoints: builder.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      weeklyRanks: builder.userWeeklyStats.map((rank) => rank.rank) ?? [],
      draftSeasonOffersReceived: builder.draftSeasonOffersReceived.length
    }))
    .sort((a, b) => {
      if (sort === 'trending') {
        return b.draftSeasonOffersReceived - a.draftSeasonOffersReceived;
      }
      return b.seasonPoints - a.seasonPoints;
    })
    .map(({ draftSeasonOffersReceived, ...developer }, index) => ({
      ...developer,
      rank: index + 1
    }));
}
