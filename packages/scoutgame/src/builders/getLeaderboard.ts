import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, getCurrentSeason, validateISOWeek } from '@packages/dates/utils';
import { parseUnits } from 'viem';

import { devTokenDecimals } from '../protocol/constants';

export type LeaderBoardRow = {
  id: string;
  avatar: string | null;
  displayName: string;
  path: string;
  builderStatus: BuilderStatus;
  progress: number;
  gemsCollected: number;
  price: bigint;
  nftType: BuilderNftType;
  congratsImageUrl?: string | null;
};

export async function getLeaderboard({
  limit = 10,
  week = getCurrentWeek()
}: {
  limit?: number;
  week?: string;
}): Promise<LeaderBoardRow[]> {
  const isWeekValid = validateISOWeek(week);
  const season = getCurrentSeason(week).start;

  if (!isWeekValid) {
    throw new InvalidInputError('Invalid week for leaderboard');
  }

  const weeklyTopBuilders = await prisma.userWeeklyStats.findMany({
    where: {
      week,
      season,
      rank: {
        not: null
      },
      user: {
        builderStatus: 'approved'
      }
    },
    orderBy: {
      rank: 'asc'
    },
    take: limit,
    select: {
      gemsCollected: true,
      user: {
        select: {
          id: true,
          avatar: true,
          path: true,
          displayName: true,
          builderStatus: true,
          builderNfts: {
            where: {
              season,
              nftType: BuilderNftType.default
            },
            select: {
              currentPrice: true,
              currentPriceDevToken: true,
              currentListingPrice: true,
              season: true,
              imageUrl: true,
              nftType: true,
              congratsImageUrl: true
            }
          }
        }
      }
    }
  });

  return weeklyTopBuilders
    .map((weeklyTopBuilder) => {
      const maxGemsCollected = weeklyTopBuilders[0].gemsCollected;
      const progress = (weeklyTopBuilder.gemsCollected / maxGemsCollected) * 100;
      const nft = weeklyTopBuilder.user.builderNfts.find((n) => n.season === season);
      const price = nft?.currentListingPrice
        ? parseUnits(nft.currentListingPrice.toString(), devTokenDecimals)
        : BigInt(nft?.currentPriceDevToken ?? 0);
      return {
        id: weeklyTopBuilder.user.id,
        avatar: weeklyTopBuilder.user.avatar,
        displayName: weeklyTopBuilder.user.displayName,
        path: weeklyTopBuilder.user.path,
        builderStatus: weeklyTopBuilder.user.builderStatus!,
        gemsCollected: weeklyTopBuilder.gemsCollected,
        progress,
        price,
        nftImageUrl: nft?.imageUrl,
        nftType: nft?.nftType ?? BuilderNftType.default,
        congratsImageUrl: nft?.congratsImageUrl
      };
    })
    .filter((builder) => builder.gemsCollected > 0);
}
