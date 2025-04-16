import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import type { DraftDeveloper } from './getDraftDevelopers';

export async function getDraftSeasonOffers({ scoutId }: { scoutId: string }) {
  const season = getCurrentSeasonStart();

  if (!season) {
    throw new Error('No draft season found');
  }

  const draftSeasonOffers = await prisma.draftSeasonOffer.findMany({
    where: {
      makerWallet: {
        scoutId
      }
    },
    select: {
      value: true,
      createdAt: true,
      developer: {
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
      }
    }
  });

  const developersRecord: Record<string, DraftDeveloper> = {};

  for (const draftSeasonOffer of draftSeasonOffers) {
    if (!developersRecord[draftSeasonOffer.developer.id]) {
      developersRecord[draftSeasonOffer.developer.id] = {
        id: draftSeasonOffer.developer.id,
        displayName: draftSeasonOffer.developer.displayName,
        avatar: draftSeasonOffer.developer.avatar ?? '',
        path: draftSeasonOffer.developer.path,
        level: draftSeasonOffer.developer.userSeasonStats[0]?.level ?? 0,
        seasonPoints: draftSeasonOffer.developer.userSeasonStats[0]?.pointsEarnedAsBuilder ?? 0,
        weeklyRanks: draftSeasonOffer.developer.userWeeklyStats.map((rank) => rank.rank) ?? [],
        rank: 0
      };
    }
  }

  const rankedDevelopersRecord = Object.values(developersRecord)
    .sort((a, b) => b.seasonPoints - a.seasonPoints)
    .reduce<Record<string, DraftDeveloper>>((acc, developer, index) => {
      acc[developer.id] = {
        ...developer,
        rank: index + 1
      };
      return acc;
    }, {});

  return draftSeasonOffers
    .map((draftSeasonOffer) => ({
      bidAmount: draftSeasonOffer.value,
      createdAt: draftSeasonOffer.createdAt,
      ...rankedDevelopersRecord[draftSeasonOffer.developer.id]
    }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
