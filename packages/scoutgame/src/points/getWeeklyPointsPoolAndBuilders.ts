import type { BuilderNftType, ScoutWallet } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { validMintNftPurchaseEvent, weeklyRewardableBuilders } from '../builderNfts/constants';
import { getCurrentWeekPointsAllocation } from '../builderNfts/getCurrentWeekPointsAllocation';
import { getBuildersLeaderboard } from '../builders/getBuildersLeaderboard';

import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

export type PartialNftPurchaseEvent = {
  tokensPurchased: number;
  tokenId: number;
  nftType: BuilderNftType;
  from: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  to: null | Pick<ScoutWallet, 'address' | 'scoutId'>;
  builderNft: { nftType: BuilderNftType; builderId: string };
};

/**
 * @param normalisedBuilders - Expected points share for the builder and their NFT holders for a specific week, with normalisation factor applied to ensure full weekly points pool is allocated
 */
export async function getWeeklyPointsPoolAndBuilders({ week }: { week: string }) {
  const [
    topWeeklyBuilders,
    nftPurchaseEvents,
    { normalisationFactor, totalPoints, normalisedBuilders },
    weeklyAllocatedPoints
  ] = await Promise.all([
    getBuildersLeaderboard({ quantity: weeklyRewardableBuilders, week }),
    getNftPurchaseEvents({ week }),
    getPointsCountForWeekWithNormalisation({ week }),
    getCurrentWeekPointsAllocation({ week })
  ]);

  return {
    nftPurchaseEvents,
    topWeeklyBuilders,
    normalisationFactor,
    totalPoints,
    normalisedBuilders,
    weeklyAllocatedPoints
  };
}

export async function getNftPurchaseEvents({
  week,
  builderId
}: {
  week: string;
  builderId?: string;
}): Promise<PartialNftPurchaseEvent[]> {
  const season = getCurrentSeasonStart(week);
  return prisma.nFTPurchaseEvent
    .findMany({
      where: {
        ...validMintNftPurchaseEvent,
        builderEvent: {
          week: {
            lte: week
          }
        },
        builderNft: {
          season,
          builderId
        }
      },
      select: {
        scoutWallet: {
          select: {
            address: true,
            scoutId: true
          }
        },
        senderWallet: {
          select: {
            address: true,
            scoutId: true
          }
        },
        tokensPurchased: true,
        builderNft: {
          select: {
            tokenId: true,
            builderId: true,
            nftType: true
          }
        }
      }
    })
    .then((data) =>
      data.map(
        (record) =>
          ({
            ...record,
            from: record.senderWallet,
            to: record.scoutWallet,
            tokenId: record.builderNft.tokenId,
            nftType: record.builderNft.nftType
          }) as PartialNftPurchaseEvent
      )
    );
}
