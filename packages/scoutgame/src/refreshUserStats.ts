import type { Prisma, UserSeasonStats, UserWeeklyStats } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

import { validMintNftPurchaseEvent } from './builderNfts/constants';

export async function refreshUserStats({
  userId,
  week = getCurrentWeek(),
  tx = prisma
}: {
  userId: string;
  week?: ISOWeek;
  tx?: Prisma.TransactionClient;
}): Promise<{ weekly: UserWeeklyStats; season: UserSeasonStats }> {
  const season = getCurrentSeasonStart(week);

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
      season,
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
      season,
      builderId: userId
    },
    include: {
      nftSoldEvents: {
        where: validMintNftPurchaseEvent,
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
  });

  const nftsBought = await tx.nFTPurchaseEvent.count({
    where: {
      scoutWallet: {
        scoutId: userId
      },
      builderNft: {
        season
      }
    }
  });

  const seasonStats = {
    pointsEarnedAsBuilder: allTimeBuilderNftPoints.length,
    pointsEarnedAsScout: 0,
    season,
    nftsPurchased: nftsBought,
    nftsSold: builderNft?.nftSoldEvents.length,
    nftOwners: builderNft
      ? arrayUtils.uniqueValues(builderNft.nftSoldEvents.map((ev) => ev.scoutWallet!.scoutId)).length
      : undefined
  };

  const seasonStatsRecord = await tx.userSeasonStats.upsert({
    where: {
      userId_season: {
        season: getCurrentSeasonStart(),
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
    season: seasonStatsRecord
  };
}
