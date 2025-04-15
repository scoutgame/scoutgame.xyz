import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

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

export async function getDraftDevelopers(): Promise<DraftDeveloper[]> {
  const season = getCurrentSeasonStart();

  if (!season) {
    throw new Error('No draft season found');
  }

  const builders = await prisma.scout.findMany({
    where: {
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
      weeklyRanks: builder.userWeeklyStats.map((rank) => rank.rank) ?? []
    }))
    .sort((a, b) => b.seasonPoints - a.seasonPoints)
    .map((developer, index) => ({
      ...developer,
      rank: index + 1
    }));
}
