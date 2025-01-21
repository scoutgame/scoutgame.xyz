import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { nftTypeMultipliers } from '../points/dividePointsBetweenBuilderAndScouts';
import { getPointsCountForWeekWithNormalisation } from '../points/getPointsCountForWeekWithNormalisation';

import type { BuilderNftWithOwners } from './getAllSeasonNftsWithOwners';
import { getAllSeasonNftsWithOwners } from './getAllSeasonNftsWithOwners';

/**
 * Refresh estimated payouts for a given week
 *
 * @param builderToRefresh - Builder ID to refresh. If not provided, all builders will be refreshed
 */
export async function refreshEstimatedPayouts({
  week,
  builderIdToRefresh
}: {
  week: ISOWeek;
  builderIdToRefresh?: string;
}): Promise<void> {
  const season = getCurrentSeasonStart(week);

  const [{ normalisedBuilders }, data] = await Promise.all([
    getPointsCountForWeekWithNormalisation({
      week
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
        normalisedPoints * (nftTypeMultipliers.default / weightedBalanceWithNextPurchase)
      );

      const expectedPayoutForNextStarterPackPurchase = Math.floor(
        normalisedPoints * (nftTypeMultipliers.starter_pack / weightedBalanceWithNextStarterPackPurchase)
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
}
