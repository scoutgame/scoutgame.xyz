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
  const season = getPreviousSeason(getCurrentSeasonStart());

  if (!season) {
    throw new Error('No draft season found');
  }

  const developers = await prisma.scout.findMany({
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

  const formattedDevelopers = developers
    .map((developer) => ({
      id: developer.id,
      displayName: developer.displayName,
      avatar: developer.avatar ?? '',
      path: developer.path,
      level: developer.userSeasonStats[0]?.level ?? 0,
      seasonPoints: developer.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
      weeklyRanks: developer.userWeeklyStats.map((rank) => rank.rank) ?? [],
      draftSeasonOffersReceived: developer.draftSeasonOffersReceived.length
    }))
    .sort((a, b) => {
      return b.seasonPoints - a.seasonPoints;
    })
    .map((developer, index) => ({
      ...developer,
      rank: index + 1
    }));

  if (sort === 'all') {
    return formattedDevelopers;
  }

  return formattedDevelopers.sort((a, b) => b.draftSeasonOffersReceived - a.draftSeasonOffersReceived);
}
