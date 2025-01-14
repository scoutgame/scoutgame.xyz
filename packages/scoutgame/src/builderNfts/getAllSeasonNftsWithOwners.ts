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

/**
 * Get all the NFTs for a specific season along with their owners. This is based on the scoutNFT table which is synced with onchain activity ie. mints, transfers and burns
 */
export async function getAllSeasonNftsWithOwners({ season }: { season: ISOWeek }): Promise<SeasonNfts> {
  const [seasonBuilderNfts, seasonStarterPackNfts] = await Promise.all([
    prisma.builderNft.findMany({
      where: {
        season,
        nftType: BuilderNftType.default
      },
      include: {
        nftOwners: true
      }
    }),
    prisma.builderNft.findMany({
      where: {
        season,
        nftType: BuilderNftType.starter_pack
      },
      include: {
        nftOwners: true
      }
    })
  ]);

  return {
    default: seasonBuilderNfts,
    starter_pack: seasonStarterPackNfts
  };
}
