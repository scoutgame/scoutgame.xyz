import { prisma } from '@charmverse/core/prisma-client';
import { NULL_EVM_ADDRESS } from '@charmverse/core/protocol';
import { getCurrentWeek, getCurrentSeason } from '@packages/dates/utils';

import { dividePointsBetweenBuilderAndScouts } from '../points/dividePointsBetweenBuilderAndScouts';

export type NftStats = {
  builderStrikes: number;
  nftSupply: { default: number; starterPack: number; total: number };
};

export async function getBuilderNftStats({
  builderId,
  week = getCurrentWeek()
}: {
  builderId: string;
  week?: string;
}): Promise<NftStats> {
  const season = getCurrentSeason(week).start;
  const [nftPurchaseEvents, builderStrikes] = await Promise.all([
    prisma.nFTPurchaseEvent.findMany({
      where: {
        senderWalletAddress: null,
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
