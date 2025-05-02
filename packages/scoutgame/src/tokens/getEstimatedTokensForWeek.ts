import { computeTokenOwnershipForBuilder, getNftPurchaseEvents } from '../protocol/resolveTokenOwnershipForBuilder';

import { divideTokensBetweenDeveloperAndHolders } from './divideTokensBetweenDeveloperAndHolders';
import { getTokensCountForWeekWithNormalisation } from './getTokensCountForWeekWithNormalisation';

// return a map of points per scout for the week
export async function getEstimatedTokensForWeek({ week }: { week: string }) {
  const [{ normalisationFactor, topWeeklyDevelopers, weeklyAllocatedTokens }, nftPurchaseEvents] = await Promise.all([
    getTokensCountForWeekWithNormalisation({
      week
    }),
    getNftPurchaseEvents({ week })
  ]);

  // aggregate values for each scout per topWeeklyBuilder
  const tokensPerScout = topWeeklyDevelopers.reduce<Record<string, number>>((__tokensPerScout, developer) => {
    const tokenOwnership = computeTokenOwnershipForBuilder({
      purchaseEvents: nftPurchaseEvents.filter((event) => event.builderNft.builderId === developer.developer.id)
    });

    const { tokensPerScoutByScoutId: developerTokensPerScout } = divideTokensBetweenDeveloperAndHolders({
      rank: developer.rank,
      weeklyAllocatedTokens,
      normalisationFactor,
      owners: tokenOwnership
    });
    developerTokensPerScout.forEach(({ scoutId, erc20Tokens }) => {
      __tokensPerScout[scoutId] = (__tokensPerScout[scoutId] || 0) + erc20Tokens;
    });
    return __tokensPerScout;
  }, {});

  const nftMintEvents = nftPurchaseEvents.filter((event) => event.to && event.from === null);

  return {
    nftPurchaseEvents: nftMintEvents,
    tokensPerScout
  };
}
