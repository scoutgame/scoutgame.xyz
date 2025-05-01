import { prisma } from '@charmverse/core/prisma-client';
import type { ISOWeek } from '@packages/dates/config';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { calculateRewardForScout } from '../points/divideTokensBetweenDeveloperAndHolders';
import { getPointsCountForWeekWithNormalisation } from '../points/getPointsCountForWeekWithNormalisation';
import { devTokenDecimals } from '../protocol/constants';

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

  const [{ normalisedDevelopers }, data] = await Promise.all([
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

  // Zero out the estimated payouts for builders who don't rank
  await prisma.builderNft.updateMany({
    where: {
      season,
      builderId: {
        notIn: normalisedDevelopers.map((b) => b.developer.developer.id)
      }
    },
    data: {
      estimatedPayout: 0,
      estimatedPayoutDevToken: '0'
    }
  });

  for (const { developer, normalisedTokens } of normalisedDevelopers) {
    if (!builderIdToRefresh || builderIdToRefresh === developer.developer.id) {
      const defaultNft = seasonBuilderNfts[developer.developer.id];
      const starterPackNft = seasonStarterPackNfts[developer.developer.id];

      const supply = {
        starterPack: (starterPackNft?.nftOwners || []).reduce((acc, nft) => acc + nft.balance, 0),
        default: defaultNft.nftOwners.reduce((acc, nft) => acc + nft.balance, 0)
      };

      // add one to simulate the future state after purchasing a card
      supply.default += 1;
      supply.starterPack += 1;

      const nextDefaultReward = calculateRewardForScout({
        purchased: { default: 1 },
        supply,
        scoutsRewardPool: normalisedTokens
      });
      const expectedPayoutForNextNftPurchase = Math.floor(nextDefaultReward);

      const nextStarterPackReward = calculateRewardForScout({
        purchased: { starterPack: 1 },
        supply,
        scoutsRewardPool: normalisedTokens
      });
      const expectedPayoutForNextStarterPackPurchase = Math.floor(nextStarterPackReward);

      if (expectedPayoutForNextNftPurchase !== defaultNft.estimatedPayout) {
        await prisma.builderNft.update({
          where: {
            id: defaultNft.id
          },
          data: {
            estimatedPayout: expectedPayoutForNextNftPurchase,
            estimatedPayoutDevToken: (
              BigInt(expectedPayoutForNextNftPurchase) * BigInt(10 ** devTokenDecimals)
            ).toString()
          }
        });
      }

      if (starterPackNft && expectedPayoutForNextStarterPackPurchase !== starterPackNft.estimatedPayout) {
        await prisma.builderNft.update({
          where: {
            id: starterPackNft.id
          },
          data: {
            estimatedPayout: expectedPayoutForNextStarterPackPurchase,
            estimatedPayoutDevToken: (
              BigInt(expectedPayoutForNextStarterPackPurchase) * BigInt(10 ** devTokenDecimals)
            ).toString()
          }
        });
      }
    }
  }
}
