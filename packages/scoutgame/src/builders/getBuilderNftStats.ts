import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { dividePointsBetweenBuilderAndScouts } from '@packages/scoutgame/points/dividePointsBetweenBuilderAndScouts';

export type NftStats = {
  builderStrikes: number;
  nftSupply: { default: number; starterPack: number; total: number };
};

export async function getBuilderNftStats({
  builderId,
  season = currentSeason,
  week = getCurrentWeek()
}: {
  builderId: string;
  season?: string;
  week?: string;
}): Promise<NftStats> {
  const [nftPurchaseEvents, builderStrikes] = await Promise.all([
    prisma.nFTPurchaseEvent.findMany({
      where: {
        builderEvent: {
          week: {
            lte: week
          }
        },
        builderNft: {
          builderId,
          season
        }
      },
      select: {
        scoutId: true,
        tokensPurchased: true,
        builderNft: {
          select: {
            builderId: true,
            nftType: true
          }
        }
      }
    }),
    prisma.builderStrike.count({
      where: {
        builderId
      }
    })
  ]);
  const { nftSupply } = dividePointsBetweenBuilderAndScouts({
    builderId,
    nftPurchaseEvents,
    rank: 1, // rank doesnt actually matter here
    weeklyAllocatedPoints: 100,
    normalisationFactor: 1
  });
  return {
    builderStrikes,
    nftSupply
  };
}
