import type { Prisma, UserSeasonStats, UserWeeklyStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

import type { ISOWeek } from './dates';
import { currentSeason, getCurrentWeek } from './dates';

export async function refreshUserStats({
  userId,
  week = getCurrentWeek(),
  tx = prisma
}: {
  userId: string;
  week?: ISOWeek;
  tx?: Prisma.TransactionClient;
}): Promise<{ weekly: UserWeeklyStats; season: UserSeasonStats }> {
  const gemsReceipts = await tx.gemsReceipt.findMany({
    where: {
      event: {
        builderId: userId,
        week
      }
    }
  });
  const gemsCollected = gemsReceipts.reduce((acc, e) => {
    return acc + e.value;
  }, 0);

  const weekly = await tx.userWeeklyStats.upsert({
    where: {
      userId_week: {
        userId,
        week
      }
    },
    create: {
      userId,
      season: currentSeason,
      week,
      gemsCollected
    },
    update: {
      gemsCollected
    }
  });

  const allTimeBuilderNftPoints = await tx.pointsReceipt.findMany({
    where: {
      recipientId: userId,
      event: {
        githubEvent: {
          githubUser: {
            builderId: userId
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  const builderNft = await tx.builderNft.findFirst({
    where: {
      season: currentSeason,
      builderId: userId
    },
    include: {
      nftSoldEvents: {
        select: {
          scoutId: true,
          tokensPurchased: true
        }
      }
    }
  });

  const nftsBought = await tx.nFTPurchaseEvent.count({
    where: {
      scoutId: userId,
      builderNft: {
        season: currentSeason
      }
    }
  });

  const seasonStats = {
    pointsEarnedAsBuilder: allTimeBuilderNftPoints.length,
    pointsEarnedAsScout: 0,
    season: currentSeason,
    nftsPurchased: nftsBought,
    nftsSold: builderNft?.nftSoldEvents.length,
    nftOwners: builderNft ? arrayUtils.uniqueValues(builderNft.nftSoldEvents.map((ev) => ev.scoutId)).length : undefined
  };

  const season = await tx.userSeasonStats.upsert({
    where: {
      userId_season: {
        season: currentSeason,
        userId
      }
    },
    create: {
      ...seasonStats,
      lastUpdated: new Date(),
      user: {
        connect: {
          id: userId
        }
      }
    },
    update: {
      ...seasonStats
    }
  });

  return {
    weekly,
    season
  };
}
