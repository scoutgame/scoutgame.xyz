import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import { dividePointsBetweenBuilderAndScouts } from '@packages/scoutgame/points/dividePointsBetweenBuilderAndScouts';

export type NftStats = {
  builderStrikes: number;
  nftSupply: { default: number; starterPack: number; total: number };
};
export async function getBuilderNftStats(builderId: string): Promise<NftStats> {
  const [builderStrikes, { nftSupply }] = await Promise.all([
    prisma.builderStrike.count({
      where: {
        builderId
      }
    }),
    dividePointsBetweenBuilderAndScouts({
      builderId,
      season: currentSeason,
      rank: 1, // rank doesnt actually matter here
      weeklyAllocatedPoints: 100,
      normalisationFactor: 1
    })
  ]);
  return {
    builderStrikes,
    nftSupply
  };
}
