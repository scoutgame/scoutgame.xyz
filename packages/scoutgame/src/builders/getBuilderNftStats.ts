import { prisma } from '@charmverse/core/prisma-client';

export type NftStats = {
  builderStrikes: number;
  defaultNftsSold: number;
  starterPackNftsSold: number;
};
export async function getBuilderNftStats(builderId: string) {
  const builderStrikes = await prisma.builderStrike.count({
    where: {
      builderId
    }
  });
  const result: NftStats = {
    builderStrikes,
    defaultNftsSold: 0,
    starterPackNftsSold: 0
  };
}
