import type { BuilderNft, ScoutNft } from '@charmverse/core/prisma-client';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';

export type BuilderNftWithOwners = BuilderNft & {
  nftOwners: ScoutNft[];
};

export type SeasonNfts = {
  default: BuilderNftWithOwners[];
  starter_pack: BuilderNftWithOwners[];
};

export async function getAllSeasonNftsWithOwners({ season }: { season: ISOWeek }): Promise<SeasonNfts> {
  const seasonBuilderNfts = await prisma.builderNft.findMany({
    where: {
      season,
      nftType: BuilderNftType.default
    },
    include: {
      nftOwners: true
    }
  });

  const seasonStarterPackNfts = await prisma.builderNft.findMany({
    where: {
      season,
      nftType: BuilderNftType.starter_pack
    },
    include: {
      nftOwners: true
    }
  });

  return {
    default: seasonBuilderNfts,
    starter_pack: seasonStarterPackNfts
  };
}
