import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { uniqueValues } from '@packages/utils/array';
import { getPlatform } from '@packages/utils/platform';

export type BuilderSearchResult = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

const platform = getPlatform();

export async function searchBuilders({
  search,
  limit = 10
}: {
  search: string;
  limit?: number;
}): Promise<BuilderSearchResult[]> {
  const season = getCurrentSeasonStart();
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      OR: [
        {
          path: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          displayName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ],
      deletedAt: null
    },
    take: limit,
    orderBy: {
      // Sort by similarity to the query
      _relevance: {
        fields: ['path', 'displayName'],
        search,
        sort: 'desc'
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      userSeasonStats: {
        where: {
          season
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season,
          nftType: BuilderNftType.default
        },
        select: {
          currentPrice: true,
          currentPriceInScoutToken: true,
          nftSoldEvents: {
            select: {
              scoutWallet: {
                select: {
                  scoutId: true
                }
              }
            }
          }
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true
        }
      }
    }
  });

  return builders.map((builder) => ({
    id: builder.id,
    path: builder.path,
    displayName: builder.displayName!,
    avatar: builder.avatar,
    seasonPoints: builder.userSeasonStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    allTimePoints: builder.userAllTimeStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    scoutedBy: uniqueValues(
      builder.builderNfts?.[0]?.nftSoldEvents?.flatMap((event) => event.scoutWallet?.scoutId) ?? []
    ).length,
    price:
      platform === 'onchain_webapp'
        ? Number(builder.builderNfts?.[0]?.currentPriceInScoutToken ?? 0)
        : Number(builder.builderNfts?.[0]?.currentPrice ?? 0)
  }));
}
