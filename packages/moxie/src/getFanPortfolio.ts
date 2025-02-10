import { log } from '@charmverse/core/log';

import { airstackRequest } from './airstackRequest';

// source: https://docs.airstack.xyz/airstack-docs-and-faqs/moxie/moxie-fan-token-balances#check-if-certain-user-hold-certain-fan-token
export async function getFanPortfolio({ scoutFid }: { scoutFid: number }): Promise<Record<string, number>> {
  const query = `
    query GetPortfolioInfo {
      MoxieUserPortfolios(
        input: {
          filter: {
            fid: {_eq: "${scoutFid}"}
          }
        }
      ) {
        MoxieUserPortfolio {
          amount: totalUnlockedAmount
          fanTokenSymbol
        }
      }
    }
  `;
  const response = await airstackRequest<{
    errors?: { message: string; path: any[] }[];
    data: { MoxieUserPortfolios: null | { MoxieUserPortfolio: { amount: number; fanTokenSymbol: string }[] | null } };
  }>(query);
  if (response.errors?.length) {
    log.warn('Errors fetching Moxie fan token balances', { scoutFid, errors: response.errors });
    throw new Error(`Errors fetching Moxie fan token balances: ${response.errors[0].message}`);
  } else if (response.data.MoxieUserPortfolios === null) {
    log.warn('No Moxie fan token balances found', { scoutFid, response });
    return {};
  }
  return (response.data.MoxieUserPortfolios.MoxieUserPortfolio || []).reduce<Record<string, number>>((acc, curr) => {
    // fanTokenSymbol examples: "fid:2600",  "cid:mfers", "Moxie:pishi74.base.eth-base"
    const symbolParts = curr.fanTokenSymbol.split(':');
    if (symbolParts[0] === 'fid') {
      acc[symbolParts[1]] = curr.amount;
    } else {
      // console.log('Unknown fan token symbol', { scoutFid, fanTokenSymbol: curr.fanTokenSymbol });
    }
    return acc;
  }, {});
}
