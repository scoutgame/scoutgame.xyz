import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getPreviousSeason } from '@packages/dates/utils';

export async function getDraftDevelopers() {
  const draftSeason = getCurrentSeasonStart();
  // For testing purposes
  const season = draftSeason ? getPreviousSeason(draftSeason) : getCurrentSeasonStart();

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
      deletedAt: null
    },
    select: {
      id: true,
      displayName: true,
      avatar: true,
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
      avatar: builder.avatar,
      level: builder.userSeasonStats[0].level,
      seasonPoints: builder.userSeasonStats[0].pointsEarnedAsBuilder,
      weeklyRanks: builder.userWeeklyStats.map((rank) => rank.rank)
    }))
    .sort((a, b) => b.seasonPoints - a.seasonPoints)
    .map((developer, index) => ({
      ...developer,
      rank: index + 1
    }));
}
