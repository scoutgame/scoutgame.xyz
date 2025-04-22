import { prisma } from '@charmverse/core/prisma-client';

export type DeveloperScoutBid = {
  id: string;
  value: string;
  createdAt: Date;
};

export type DraftDeveloper = {
  id: string;
  displayName: string;
  avatar: string;
  path: string;
  level: number;
  seasonPoints: number;
  weeklyRanks: (number | null)[];
  rank: number;
  bidsReceived: number;
  scoutBids: DeveloperScoutBid[];
};

export type DraftDeveloperSort = 'all' | 'trending';

export async function getDraftDevelopers({
  search,
  sort,
  scoutId
}: {
  search?: string;
  sort?: DraftDeveloperSort;
  scoutId?: string;
}): Promise<DraftDeveloper[]> {
  const season = '2025-W02';

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
      },
      userSeasonStats: {
        some: {
          season,
          level: {
            gt: 0
          }
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
          id: true,
          value: true,
          createdAt: true,
          makerWallet: {
            select: {
              scoutId: true
            }
          }
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
      bidsReceived: developer.draftSeasonOffersReceived.length,
      scoutBids: scoutId ? developer.draftSeasonOffersReceived.filter((bid) => bid.makerWallet.scoutId === scoutId) : []
    }))
    .sort((a, b) => {
      return b.seasonPoints - a.seasonPoints;
    })
    .map(({ scoutBids, ...developer }, index) => ({
      ...developer,
      // Remove the makerWallet from the scoutBids
      scoutBids: scoutBids.map((bid) => ({
        createdAt: bid.createdAt,
        id: bid.id,
        value: bid.value
      })),
      rank: index + 1
    }));

  if (sort === 'all') {
    return formattedDevelopers;
  }

  return formattedDevelopers.sort((a, b) => b.bidsReceived - a.bidsReceived);
}
