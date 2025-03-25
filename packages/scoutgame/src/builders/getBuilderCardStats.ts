import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';

import { devTokenDecimals } from '../protocol/constants';

import { normalizeLast14DaysRank } from './utils/normalizeLast14DaysRank';

export type BuilderCardStats = {
  level?: number | null;
  estimatedPayout?: number | null;
  last14DaysRank?: (number | null)[];
  gemsCollected?: number;
  nftsSoldToLoggedInScout: number | undefined;
  starterNftSoldToLoggedInScout: boolean;
};

export async function getBuilderCardStats({
  builderId,
  loggedInScoutId
}: {
  builderId: string;
  loggedInScoutId?: string;
}): Promise<BuilderCardStats> {
  const isOnchain = isOnchainPlatform();
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
          estimatedPayoutDevToken: true,
          nftType: true,
          nftOwners: loggedInScoutId
            ? {
                where: {
                  scoutWallet: {
                    scoutId: loggedInScoutId
                  }
                },
                select: {
                  balance: true
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
    estimatedPayout: isOnchain
      ? Number(BigInt(defaultNft?.estimatedPayoutDevToken ?? 0) / BigInt(10 ** devTokenDecimals))
      : defaultNft?.estimatedPayout,
    last14DaysRank: normalizeLast14DaysRank(builder.builderCardActivities[0]),
    gemsCollected: builder.userWeeklyStats[0]?.gemsCollected,
    nftsSoldToLoggedInScout: defaultNft?.nftOwners?.[0]?.balance || 0,
    starterNftSoldToLoggedInScout: (starterPackNft?.nftOwners?.[0]?.balance ?? 0) > 0
  };
}
