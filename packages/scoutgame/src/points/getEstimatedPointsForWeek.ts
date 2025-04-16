import { computeTokenOwnershipForBuilder, getNftPurchaseEvents } from '../protocol/resolveTokenOwnershipForBuilder';

import { divideTokensBetweenBuilderAndHolders } from './divideTokensBetweenBuilderAndHolders';
import { getPointsCountForWeekWithNormalisation } from './getPointsCountForWeekWithNormalisation';

// return a map of points per scout for the week
export async function getEstimatedPointsForWeek({ week }: { week: string }) {
  const [{ normalisationFactor, topWeeklyBuilders, weeklyAllocatedPoints }, nftPurchaseEvents] = await Promise.all([
    getPointsCountForWeekWithNormalisation({
      week
    }),
    getNftPurchaseEvents({ week })
  ]);

  // aggregate values for each scout per topWeeklyBuilder
  const pointsPerScout = topWeeklyBuilders.reduce<Record<string, number>>((__pointsPerScout, builder) => {
    const tokenOwnership = computeTokenOwnershipForBuilder({
      purchaseEvents: nftPurchaseEvents.filter((event) => event.builderNft.builderId === builder.builder.id)
    });

    const { tokensPerScoutByScoutId: builderPointsPerScout } = divideTokensBetweenBuilderAndHolders({
      builderId: builder.builder.id,
      rank: builder.rank,
      weeklyAllocatedTokens: weeklyAllocatedPoints,
      normalisationFactor,
      owners: tokenOwnership
    });
    builderPointsPerScout.forEach(({ scoutId, erc20Tokens }) => {
      __pointsPerScout[scoutId] = (__pointsPerScout[scoutId] || 0) + erc20Tokens;
    });
    return __pointsPerScout;
  }, {});

  const nftMintEvents = nftPurchaseEvents.filter((event) => event.to && event.from === null);

  return {
    nftPurchaseEvents: nftMintEvents,
    pointsPerScout
  };
}
