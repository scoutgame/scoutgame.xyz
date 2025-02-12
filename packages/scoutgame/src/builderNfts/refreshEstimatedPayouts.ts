import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { nftTypeMultipliers } from '../points/divideTokensBetweenBuilderAndHolders';
import { getPointsCountForWeekWithNormalisation } from '../points/getPointsCountForWeekWithNormalisation';

import { scoutPointsShare } from './constants';
import type { BuilderNftWithOwners } from './getAllSeasonNftsWithOwners';
import { getAllSeasonNftsWithOwners } from './getAllSeasonNftsWithOwners';

/**
 * Refresh estimated payouts for a given week
 *
 * @param builderToRefresh - Builder ID to refresh. If not provided, all builders will be refreshed
 */
export async function refreshEstimatedPayouts({
  week,
  builderIdToRefresh,
  useOnchainLeaderboard
}: {
  week: ISOWeek;
  builderIdToRefresh?: string;
  useOnchainLeaderboard?: boolean;
}): Promise<void> {
  const season = getCurrentSeasonStart(week);

  const [{ normalisedBuilders }, data] = await Promise.all([
    getPointsCountForWeekWithNormalisation({
      week,
      useOnchainLeaderboard
    }),
    getAllSeasonNftsWithOwners({ season })
  ]);

  const seasonBuilderNfts = data.default.reduce(
    (acc, nft) => ({
      ...acc,
      [nft.builderId]: nft
    }),
    {} as Record<string, BuilderNftWithOwners>
  );

  const seasonStarterPackNfts = data.starter_pack.reduce(
    (acc, nft) => ({
      ...acc,
      [nft.builderId]: nft
    }),
    {} as Record<string, BuilderNftWithOwners>
  );

  // Zero out the estimated payouts for builders who don't rank
  await prisma.builderNft.updateMany({
    where: {
      season,
      builderId: {
        notIn: normalisedBuilders.map((b) => b.builder.builder.id)
      }
    },
    data: {
      estimatedPayout: 0
    }
  });

  for (const { builder, normalisedPoints } of normalisedBuilders) {
    if (!builderIdToRefresh || builderIdToRefresh === builder.builder.id) {
      const defaultNft = seasonBuilderNfts[builder.builder.id];
      const starterPackNft = seasonStarterPackNfts[builder.builder.id];

      const defaultNftBalance = defaultNft.nftOwners.reduce((acc, nft) => acc + nft.balance, 0);
      const starterPackNftBalance = starterPackNft?.nftOwners.reduce((acc, nft) => acc + nft.balance, 0) ?? 0;

      const builderNftBalanceWeighted = defaultNftBalance * nftTypeMultipliers.default;
      const starterPackNftBalanceWeighted = starterPackNftBalance * nftTypeMultipliers.starter_pack;

      const totalNftBalance = builderNftBalanceWeighted + starterPackNftBalanceWeighted;

      // Simulate balance with next purchase
      const weightedBalanceWithNextPurchase = totalNftBalance + nftTypeMultipliers.default;
      const weightedBalanceWithNextStarterPackPurchase = totalNftBalance + nftTypeMultipliers.starter_pack;

      const expectedPayoutForNextNftPurchase = Math.floor(
        scoutPointsShare * normalisedPoints * (nftTypeMultipliers.default / weightedBalanceWithNextPurchase)
      );

      const expectedPayoutForNextStarterPackPurchase = Math.floor(
        scoutPointsShare *
          normalisedPoints *
          (nftTypeMultipliers.starter_pack / weightedBalanceWithNextStarterPackPurchase)
      );

      if (expectedPayoutForNextNftPurchase !== defaultNft.estimatedPayout) {
        await prisma.builderNft.update({
          where: {
            id: defaultNft.id
          },
          data: {
            estimatedPayout: expectedPayoutForNextNftPurchase
          }
        });
      }

      if (starterPackNft && expectedPayoutForNextStarterPackPurchase !== starterPackNft.estimatedPayout) {
        await prisma.builderNft.update({
          where: {
            id: starterPackNft.id
          },
          data: {
            estimatedPayout: expectedPayoutForNextStarterPackPurchase
          }
        });
      }
    }
  }

  log.info('Estimated payouts refreshed', { week, userId: builderIdToRefresh });
}
