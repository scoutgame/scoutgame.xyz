import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';

export type NftStats = {
  builderStrikes: number;
  defaultNftsSold: number;
  starterPackNftsSold: number;
  totalNftsSold: number;
};
export async function getBuilderNftStats(builderId: string): Promise<NftStats> {
  const [builderStrikes, defaultNftsSold, starterPackNftsSold] = await Promise.all([
    prisma.builderStrike.count({
      where: {
        builderId
      }
    }),
    prisma.nFTPurchaseEvent.count({
      where: {
        builderNft: {
          builderId,
          season: currentSeason,
          nftType: 'default'
        }
      }
    }),
    prisma.nFTPurchaseEvent.count({
      where: {
        builderNft: {
          builderId,
          season: currentSeason,
          nftType: 'starter_pack'
        }
      }
    })
  ]);
  return {
    builderStrikes,
    defaultNftsSold,
    starterPackNftsSold,
    totalNftsSold: defaultNftsSold + starterPackNftsSold
  };
}
