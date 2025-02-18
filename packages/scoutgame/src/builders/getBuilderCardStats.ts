import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type BuilderCardStats = {
  level?: number | null;
  estimatedPayout?: number | null;
  last14DaysRank?: (number | null)[];
  gemsCollected?: number;
  nftsSoldToScout?: number;
  starterPackSoldToScout: boolean;
};

export async function getBuilderCardStats({
  builderId,
  scoutId
}: {
  builderId: string;
  scoutId?: string;
}): Promise<BuilderCardStats> {
  const season = getCurrentSeasonStart();
  const builder = await prisma.scout.findUniqueOrThrow({
    where: { id: builderId },
    select: {
      userSeasonStats: {
        where: {
          season
        },
        select: {
          level: true
        }
      },
      builderCardActivities: {
        select: {
          last14Days: true
        }
      },
      builderNfts: {
        where: {
          season
        },
        select: {
          estimatedPayout: true,
          nftType: true,
          nftSoldEvents: scoutId
            ? {
                where: {
                  ...validMintNftPurchaseEvent,
                  scoutWallet: {
                    scoutId
                  }
                },
                select: {
                  tokensPurchased: true
                }
              }
            : undefined
        }
      },
      userWeeklyStats: {
        where: {
          week: getCurrentWeek()
        },
        select: {
          gemsCollected: true
        }
      }
    }
  });
  const defaultNft = builder.builderNfts.find((nft) => nft.nftType === BuilderNftType.default);
  const starterPackNft = builder.builderNfts.find((nft) => nft.nftType === BuilderNftType.starter_pack);
  return {
    level: builder.userSeasonStats[0]?.level,
    estimatedPayout: defaultNft?.estimatedPayout,
    last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
    gemsCollected: builder.userWeeklyStats[0]?.gemsCollected,
    nftsSoldToScout: defaultNft?.nftSoldEvents?.reduce((acc, event) => acc + (event.tokensPurchased || 0), 0),
    starterPackSoldToScout: (starterPackNft?.nftSoldEvents || []).length > 0
  };
}
