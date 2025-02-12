import { log } from '@charmverse/core/log';

import { airstackRequestWithPagination } from './airstackRequest';

type Result = Record<string, number>;

// source: https://docs.airstack.xyz/airstack-docs-and-faqs/moxie/moxie-fan-token-balances#check-if-certain-user-hold-certain-fan-token
export async function getFanPortfolio({ scoutFid }: { scoutFid: number }): Promise<Record<string, number>> {
  const query = `
    query GetPortfolioInfo($cursor: String) {
      MoxieUserPortfolios(
        input: {
          filter: {
            fid: {_eq: "${scoutFid}"}
          },
          limit: 200,
          cursor: $cursor
        }
      ) {
        MoxieUserPortfolio {
          amount: totalUnlockedAmount
          fanTokenSymbol
        }
      }
    }
  `;
  const pages = await airstackRequestWithPagination<{
    MoxieUserPortfolios: null | { MoxieUserPortfolio: { amount: number; fanTokenSymbol: string }[] | null };
  }>(query);
  // map over response, which is an array of pages returned via pagination
  return pages.reduce<Result>((acc, page) => {
    if (page.MoxieUserPortfolios === null) {
      log.warn('No Moxie fan token balances found', { scoutFid, page });
      return acc;
    }
    return (page.MoxieUserPortfolios.MoxieUserPortfolio || []).reduce<Result>((_acc, token) => {
      // fanTokenSymbol examples: "fid:2600",  "cid:mfers", "Moxie:pishi74.base.eth-base"
      const symbolParts = token.fanTokenSymbol.split(':');
      if (symbolParts[0] === 'fid') {
        acc[symbolParts[1]] = token.amount;
      } else {
        // console.log('Unknown fan token symbol', { scoutFid, fanTokenSymbol: curr.fanTokenSymbol });
      }
      return acc;
    }, {});
  }, {});
}
